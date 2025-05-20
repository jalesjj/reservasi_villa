const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 2207;

// Konfigurasi Oracle
const dbConfig = {
  user: 'C##JALES',
  password: 'jales123',
  connectString: 'localhost/orcl' // Ganti sesuai SID/Service Name
};

// Middleware
app.use(express.static('public'));
app.use(express.static('vendor'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ==============================
// Konfigurasi Upload File
// ==============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ==============================
// Endpoint RESERVASI
// ==============================
app.post('/reservasi', upload.single('buktiDP'), async (req, res) => {
  try {
    // Tambahkan log untuk debugging
    console.log("Form data received:", req.body);
    console.log("File received:", req.file);
    
    const {
      nama, alamat, alamatEmail, nomorHP,
      jumlahOrang, checkIn, jamCheckIn,
      checkOut, jamCheckOut, pilihanVila
    } = req.body;

    const buktiDP = req.file ? req.file.filename : null;
    
    // Log nilai yang akan dikirim ke database
    console.log("pilihanVila:", pilihanVila);
    console.log("buktiDP:", buktiDP);

    const connection = await oracledb.getConnection(dbConfig);

    await connection.execute(
      `INSERT INTO reservasi 
      (nama, alamat, alamatEmail, nomorHP, jumlahOrang, checkIn, jamCheckIn, checkOut, jamCheckOut, pilihanVila, buktiDP)
      VALUES (:nama, :alamat, :alamatEmail, :nomorHP, :jumlahOrang, TO_DATE(:checkIn, 'YYYY-MM-DD'), :jamCheckIn, TO_DATE(:checkOut, 'YYYY-MM-DD'), :jamCheckOut, :pilihanVila, :buktiDP)`,
      {
        nama, alamat, alamatEmail, nomorHP,
        jumlahOrang: parseInt(jumlahOrang),
        checkIn, jamCheckIn,
        checkOut, jamCheckOut,
        pilihanVila,
        buktiDP
      },
      { autoCommit: true }
    );

    await connection.close();
    res.status(201).send('Reservasi berhasil ditambahkan');
  } catch (error) {
    console.error("Error in reservasi endpoint:", error);
    res.status(500).send('Gagal menambahkan reservasi');
  }
});

// ==============================
// Endpoint KONTAK
// ==============================
app.post('/kontakkami', async (req, res) => {
  const { nama, alamatEmail, subject, message } = req.body;

  try {
    const conn = await oracledb.getConnection(dbConfig);

    await conn.execute(
      `INSERT INTO kontak (nama, alamatEmail, subject, message)
       VALUES (:nama, :alamatEmail, :subject, :message)`,
      { nama, alamatEmail, subject, message },
      { autoCommit: true }
    );

    await conn.close();
    res.status(201).send('Pesan berhasil dikirim');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal mengirim pesan');
  }
});

app.get('/kontakkami', async (req, res) => {
  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(`SELECT * FROM kontak`);
    await conn.close();

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send('Terjadi kesalahan');
  }
});

// ==============================
// Endpoint KRITIK & SARAN
// ==============================
app.post('/kritiksaran', async (req, res) => {
  const { nama, judul, kritikSaran } = req.body;

  try {
    const conn = await oracledb.getConnection(dbConfig);

    await conn.execute(
      `INSERT INTO kritiksaran (nama, judul, kritikSaran)
       VALUES (:nama, :judul, :kritikSaran)`,
      { nama, judul, kritikSaran },
      { autoCommit: true }
    );

    await conn.close();
    res.status(201).send('Kritik dan saran berhasil dikirim');
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal mengirim kritik dan saran');
  }
});

app.get('/kritiksaran', async (req, res) => {
  try {
    const conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(`SELECT * FROM kritiksaran`);
    await conn.close();

    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send('Terjadi kesalahan');
  }
});

// ==============================
// Jalankan server
// ==============================
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});