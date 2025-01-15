const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 2207;

// Koneksi ke MongoDB
mongoose.connect('mongodb://localhost:27017/reservasi_vila', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Digunakan untuk melayani file CSS, image, js
app.use(express.static('public'))

// Digunakan untuk melayani folder vendor
app.use(express.static('vendor'))

// Skema dan model untuk data reservasi
const reservasiSchema = new mongoose.Schema({
    nama: String,
    alamat: String,
    alamatEmail: String,
    nomorHP: String,
    jumlahOrang: Number,
    checkIn: { type: Date, required: true },
    jamCheckIn: String,
    checkOut: { type: Date, required: true },
    jamCheckOut: String
});

const Reservasi = mongoose.model('Reservasi', reservasiSchema);

// Skema dan model untuk data kontak
const kontakSchema = new mongoose.Schema({
    nama: String,
    alamatEmail: String,
    subject: String,
    message: String
});

const Kontak = mongoose.model('Kontak', kontakSchema);

// Skema dan model untuk data kritik dan saran
const kritikSaranSchema = new mongoose.Schema({
    nama: String,
    judul: String,
    kritikSaran: String
});

const KritikSaran = mongoose.model('KritikSaran', kritikSaranSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint untuk menambahkan reservasi
app.post('/reservasi', (req, res) => {
    const { nama, alamat, alamatEmail, nomorHP, jumlahOrang, checkIn, jamCheckIn, checkOut, jamCheckOut } = req.body;
    const reservasi = new Reservasi({
        nama,
        alamat,
        alamatEmail,
        nomorHP,
        jumlahOrang,
        checkIn: new Date(checkIn),
        jamCheckIn,
        checkOut: new Date(checkOut),
        jamCheckOut
    });

    reservasi.save()
        .then(() => {
            res.status(201).send('Reservasi berhasil ditambahkan');
        })
        .catch(err => {
            res.status(400).send('Gagal menambahkan reservasi');
        });
});

// Endpoint untuk melihat semua reservasi
app.get('/reservasi', (req, res) => {
    Reservasi.find({}, (err, reservasis) => {
        if (err) {
            res.status(500).send('Terjadi kesalahan');
        } else {
            res.status(200).json(reservasis);
        }
    });
});

// Endpoint untuk menambahkan kontak
app.post('/kontakkami', (req, res) => {
    const { nama, alamatEmail, subject, message } = req.body;
    const kontak = new Kontak({
        nama,
        alamatEmail,
        subject,
        message
    });

    kontak.save()
        .then(() => {
            res.status(201).send('Pesan berhasil dikirim');
        })
        .catch(err => {
            res.status(400).send('Gagal mengirim pesan');
        });
});

// Endpoint untuk melihat semua kontak
app.get('/kontakkami', (req, res) => {
    Kontak.find({}, (err, kontaks) => {
        if (err) {
            res.status(500).send('Terjadi kesalahan');
        } else {
            res.status(200).json(kontaks);
        }
    });
});

// Endpoint untuk menambahkan kritik dan saran
app.post('/kritiksaran', (req, res) => {
    const { nama, judul, kritikSaran } = req.body;
    const kritikSaranData = new KritikSaran({
        nama,
        judul,
        kritikSaran
    });

    kritikSaranData.save()
        .then(() => {
            res.status(201).send('Kritik dan saran berhasil dikirim');
        })
        .catch(err => {
            res.status(400).send('Gagal mengirim kritik dan saran');
        });
});

// Endpoint untuk melihat semua kritik dan saran
app.get('/kritiksaran', (req, res) => {
    KritikSaran.find({}, (err, kritiksarans) => {
        if (err) {
            res.status(500).send('Terjadi kesalahan');
        } else {
            res.status(200).json(kritiksarans);
        }
    });
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan pada http://localhost:${PORT}`);
});
