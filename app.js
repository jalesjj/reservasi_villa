// app.js
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
// Endpoint CHECK AVAILABILITY
// ==============================
app.get('/check-availability', async (req, res) => {
  try {
    console.log('Check availability request received:', req.query);
    const { checkInDate, checkOutDate } = req.query;
    
    if (!checkInDate || !checkOutDate) {
      console.log('Missing required dates');
      return res.status(400).json({ error: 'Tanggal check-in dan check-out diperlukan' });
    }
    
    // Validasi format tanggal
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
      console.log('Invalid date format');
      return res.status(400).json({ error: 'Format tanggal harus YYYY-MM-DD' });
    }
    
    try {
      console.log('Connecting to database...');
      const connection = await oracledb.getConnection(dbConfig);
      console.log('Database connection established');
      
      // Logging query parameters
      console.log('Query parameters:', { checkInDate, checkOutDate });
      
      // PENTING: Coba query sederhana dulu untuk memastikan bisa mengakses tabel
      const testQuery = await connection.execute(
        `SELECT COUNT(*) AS TOTAL FROM reservasi`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      console.log('Test query result:', testQuery.rows[0]);
      
      // Jika testQuery berhasil, jalankan query utama
      const result = await connection.execute(
        `SELECT pilihanVila 
         FROM reservasi 
         WHERE 
         (TO_DATE(:checkInDate, 'YYYY-MM-DD') BETWEEN checkIn AND checkOut - 1)
         OR
         (TO_DATE(:checkOutDate, 'YYYY-MM-DD') - 1 BETWEEN checkIn AND checkOut - 1)
         OR
         (checkIn BETWEEN TO_DATE(:checkInDate, 'YYYY-MM-DD') AND TO_DATE(:checkOutDate, 'YYYY-MM-DD') - 1)`,
        { checkInDate, checkOutDate },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      console.log('Query executed successfully');
      console.log('Overlapping reservations found:', result.rows.length);
      console.log('Query results:', result.rows);
      
      await connection.close();
      console.log('Database connection closed');
      
      // Membuat variabel untuk tracking ketersediaan vila - default TERSEDIA (true)
      let vilaJalesBooked = false;
      let vilaAkmalBooked = false;
      let vilaRizaldiBooked = false;
      
      // Jika ada hasil, ubah status menjadi tidak tersedia
      if (result.rows && result.rows.length > 0) {
        for (const reservation of result.rows) {
          const villa = reservation.PILIHANVILA; // Oracle DB mengembalikan nama kolom dalam huruf besar
          console.log('Found booking for villa:', villa);
          
          if (villa === 'Vila Jales') {
            vilaJalesBooked = true;
          } else if (villa === 'Vila Akmal') {
            vilaAkmalBooked = true;
          } else if (villa === 'Vila Rizaldi') {
            vilaRizaldiBooked = true;
          }
        }
      }
      
      // Siapkan respons - jika tidak ada booking, semua villa tersedia
      const response = {
        vilajales: !vilaJalesBooked,
        vilaakmal: !vilaAkmalBooked,
        vilarizaldi: !vilaRizaldiBooked
      };
      
      console.log('Sending response:', response);
      
      // Set headers untuk mencegah caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      res.status(200).json(response);
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Tangani kasus khusus jika tabel belum ada
      if (dbError.message && dbError.message.includes('ORA-00942')) {
        // Tabel tidak ada - mungkin pengguna belum menjalankan script pembuatan tabel
        console.log('Table does not exist - sending fallback response');
        return res.status(200).json({
          vilajales: true,
          vilaakmal: true,
          vilarizaldi: true
        });
      }
      throw dbError; // Kirim ulang error untuk ditangani oleh catch blok luar
    }
    
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ error: 'Gagal memeriksa ketersediaan: ' + error.message });
  }
});

// ==============================
// Endpoint GET UNAVAILABLE DATES
// ==============================
app.get('/unavailable-dates', async (req, res) => {
  try {
    console.log('Request for unavailable dates received');
    const connection = await oracledb.getConnection(dbConfig);
    
    // Query untuk mendapatkan semua tanggal pemesanan dari database
    const result = await connection.execute(
      `SELECT 
         pilihanVila, 
         TO_CHAR(checkIn, 'YYYY-MM-DD') AS checkInDate, 
         TO_CHAR(checkOut, 'YYYY-MM-DD') AS checkOutDate
       FROM reservasi 
       ORDER BY checkIn`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    await connection.close();
    
    // Kelompokkan hasil berdasarkan vila
    const unavailableDates = {
      'Vila Jales': [],
      'Vila Akmal': [],
      'Vila Rizaldi': []
    };
    
    // Proses data untuk setiap reservasi
    result.rows.forEach(booking => {
      const villa = booking.PILIHANVILA;
      const checkIn = new Date(booking.CHECKINDATE);
      const checkOut = new Date(booking.CHECKOUTDATE);
      
      // Ubah format tanggal ke DD/MM/YYYY
      const formattedCheckIn = formatDate(checkIn);
      const formattedCheckOut = formatDate(checkOut);
      
      // Tambahkan ke array tanggal tidak tersedia
      if (unavailableDates[villa]) {
        unavailableDates[villa].push({
          checkIn: formattedCheckIn,
          checkOut: formattedCheckOut
        });
      }
    });
    
    // Set headers untuk mencegah caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json(unavailableDates);
    
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    res.status(500).json({ error: 'Gagal mengambil data tanggal tidak tersedia' });
  }
});

// Helper function untuk format tanggal
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ==============================
// Jalankan server
// ==============================
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});