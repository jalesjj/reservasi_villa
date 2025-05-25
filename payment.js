const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');

// Konfigurasi Midtrans Snap
let snap = new midtransClient.Snap({
    isProduction: false, // Ubah ke true jika sudah live
    serverKey: 'SB-Mid-server-TY4yQMLqtfHkDspOXihruzW-'
});

// POST /payment - Membuat transaksi Midtrans
router.post('/payment', async (req, res) => {
    const {
        order_id,
        gross_amount,
        customer_name,
        customer_email,
        customer_phone
    } = req.body;

    if (!order_id || !gross_amount || !customer_name || !customer_email || !customer_phone) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    const parameter = {
        transaction_details: {
            order_id: order_id,
            gross_amount: parseInt(gross_amount),
        },
        customer_details: {
            first_name: customer_name,
            email: customer_email,
            phone: customer_phone,
        }
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });
    } catch (error) {
        res.status(500).json({
            message: 'Gagal membuat transaksi',
            error: error.message
        });
    }
});

// GET /payment-page - Menampilkan halaman pembayaran dengan Snap.js
router.get('/payment-page', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Pembayaran Midtrans</title>
</head>
<body>
    <h2>Contoh Pembayaran Midtrans Snap</h2>
    <button id="pay-button">Bayar Sekarang</button>

    <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="SB-Mid-client-4s6U-2lGi11T3znh"></script>
    <script>
        document.getElementById('pay-button').addEventListener('click', function () {
            fetch('/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'ORDER-' + Date.now(),
                    gross_amount: 100000,
                    customer_name: 'Nama Pelanggan',
                    customer_email: 'email@example.com',
                    customer_phone: '081234567890'
                })
            })
            .then(res => res.json())
            .then(data => {
                window.snap.pay(data.token, {
                    onSuccess: function(result){ alert("Pembayaran sukses!"); console.log(result); },
                    onPending: function(result){ alert("Menunggu pembayaran."); console.log(result); },
                    onError: function(result){ alert("Pembayaran gagal."); console.log(result); },
                    onClose: function(){ alert("Anda menutup popup tanpa menyelesaikan pembayaran."); }
                });
            })
            .catch(error => {
                alert("Terjadi kesalahan saat membuat transaksi.");
                console.error(error);
            });
        });
    </script>
</body>
</html>
    `);
});

module.exports = router;
