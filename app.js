const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const path = require('path');
const midtransClient = require('midtrans-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi OracleDB
const dbConfig = {
  user: 'C##JALES',
  password: 'jales123',
  connectString: 'localhost/orcl'
};

// Konfigurasi Midtrans
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: 'SB-Mid-server-TY4yQMLqtfHkDspOXihruzW-',
  clientKey: 'SB-Mid-client-4s6U-2lGi11T3znh'
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route tampilkan form pembayaran
app.get('/pembayaran', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

// Endpoint API pembayaran Midtrans
app.post('/api/payment', async (req, res) => {
  const { order_id, gross_amount, customer_name, customer_email, customer_phone } = req.body;

  const parameter = {
    transaction_details: {
      order_id: order_id,
      gross_amount: parseInt(gross_amount)
    },
    customer_details: {
      first_name: customer_name,
      email: customer_email,
      phone: customer_phone
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: 'Gagal membuat transaksi', error: error.message });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
