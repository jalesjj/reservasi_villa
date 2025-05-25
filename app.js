const express = require("express");
const bodyParser = require("body-parser");
const oracledb = require("oracledb");
const path = require("path");
const midtransClient = require("midtrans-client");

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi OracleDB
const dbConfig = {
  user: "C##JALES",
  password: "jales123",
  connectString: "localhost/orcl",
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1,
};

// Inisialisasi koneksi database
async function initialize() {
  try {
    // Cek apakah Oracle Instant Client sudah terinstall
    if (!process.env.ORACLE_HOME) {
      console.error("ORACLE_HOME environment variable tidak ditemukan");
      console.error(
        "Silakan install Oracle Instant Client dan set ORACLE_HOME"
      );
      process.exit(1);
    }

    // Set Oracle client directory
    const oracleClientPath = process.env.ORACLE_HOME;
    console.log("Menggunakan Oracle Client dari:", oracleClientPath);

    oracledb.initOracleClient({ libDir: oracleClientPath });

    await oracledb.createPool(dbConfig);
    console.log("Koneksi database berhasil dibuat");
  } catch (err) {
    console.error("Error saat membuat koneksi database:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.errorNum,
      offset: err.offset,
    });
    process.exit(1);
  }
}

// Test koneksi database
app.get("/test-db", async (req, res) => {
  let connection;
  try {
    console.log("Mencoba koneksi ke database...");
    connection = await oracledb.getConnection();
    console.log("Koneksi berhasil, menjalankan query...");

    const result = await connection.execute(`SELECT SYSDATE FROM DUAL`);
    console.log("Query berhasil:", result);

    res.json({
      status: "success",
      message: "Koneksi database berhasil",
      data: result.rows[0][0],
    });
  } catch (err) {
    console.error("Error saat test koneksi:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.errorNum,
      offset: err.offset,
    });

    res.status(500).json({
      status: "error",
      message: "Gagal koneksi ke database",
      error: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Koneksi database ditutup");
      } catch (err) {
        console.error("Error saat menutup koneksi:", err);
      }
    }
  }
});

// Konfigurasi Midtrans
let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-TY4yQMLqtfHkDspOXihruzW-",
  clientKey: "SB-Mid-client-4s6U-2lGi11T3znh",
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Route halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route tampilkan form pembayaran
app.get("/pembayaran", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "payment.html"));
});

// Endpoint API pembayaran Midtrans
app.post("/api/payment", async (req, res) => {
  const {
    order_id,
    gross_amount,
    customer_name,
    customer_email,
    customer_phone,
  } = req.body;

  const parameter = {
    transaction_details: {
      order_id: order_id,
      gross_amount: parseInt(gross_amount),
    },
    customer_details: {
      first_name: customer_name,
      email: customer_email,
      phone: customer_phone,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    res.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res
      .status(500)
      .json({ message: "Gagal membuat transaksi", error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Terjadi kesalahan!");
});

// Jalankan server

initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Gagal memulai server:", err);
    process.exit(1);
  });
