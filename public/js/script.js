document.addEventListener('DOMContentLoaded', function () {
    // Form Reservasi
    const reservasiForm = document.getElementById('reservasiForm');

    if (reservasiForm) {
        reservasiForm.addEventListener('submit', function (event) {
            event.preventDefault();
            
            // Validasi form
            const pilihanVila = document.getElementById('pilihanVila').value;
            if (!pilihanVila) {
                alert('Silakan pilih vila terlebih dahulu');
                return false;
            }
            
            const buktiDP = document.getElementById('buktiDP').files[0];
            if (!buktiDP) {
                alert('Silakan upload bukti DP terlebih dahulu');
                return false;
            }
            
            // Menggunakan FormData untuk menangani multipart/form-data (termasuk file upload)
            const formData = new FormData(reservasiForm);
            
            // PENTING: Jangan set Content-Type header ketika menggunakan FormData
            // Browser akan otomatis mengatur boundary yang tepat
            fetch('/reservasi', {
                method: 'POST',
                body: formData  // Kirim FormData langsung, jangan gunakan JSON.stringify
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(message => {
                alert(message);
                reservasiForm.reset();
                // Jika ada function fetchReservasi, jalankan di sini
                if (typeof fetchReservasi === 'function') {
                    fetchReservasi();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Terjadi kesalahan saat mengirim data: ' + error.message);
            });
        });
    }

    // Form Kontak (jika ada)
    const kontakForm = document.getElementById('kontakForm');

    if (kontakForm) {
        kontakForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const formData = new FormData(kontakForm);
            const data = {
                nama: formData.get('name'),
                alamatEmail: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            fetch('/kontakkami', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(message => {
                alert(message);
                kontakForm.reset();
                // Jika ada function fetchKontak, jalankan di sini
                if (typeof fetchKontak === 'function') {
                    fetchKontak();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Terjadi kesalahan saat mengirim data: ' + error.message);
            });
        });
    }

    // Function untuk mengambil data reservasi (jika diperlukan)
    function fetchReservasi() {
        const reservasiList = document.getElementById('reservasiList');
        if (!reservasiList) return;

        fetch('/reservasi')
            .then(response => response.json())
            .then(reservasis => {
                reservasiList.innerHTML = '';
                reservasis.forEach(reservasi => {
                    const reservasiItem = document.createElement('div');
                    reservasiItem.innerHTML = `
                        <strong>Nama:</strong> ${reservasi.nama}<br>
                        <strong>Alamat:</strong> ${reservasi.alamat}<br>
                        <strong>Alamat Email:</strong> ${reservasi.alamatEmail}<br>
                        <strong>Nomor HP:</strong> ${reservasi.nomorHP}<br>
                        <strong>Jumlah Orang:</strong> ${reservasi.jumlahOrang}<br>
                        <strong>Check In:</strong> ${reservasi.checkIn} ${reservasi.jamCheckIn}<br>
                        <strong>Check Out:</strong> ${reservasi.checkOut} ${reservasi.jamCheckOut}<br>
                        <strong>Pilihan Vila:</strong> ${reservasi.pilihanVila}<br>
                        <strong>Bukti DP:</strong> ${reservasi.buktiDP}<br><br>
                    `;
                    reservasiList.appendChild(reservasiItem);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Jalankan fetchReservasi hanya jika elemen dengan id 'reservasiList' ada di halaman
    if (document.getElementById('reservasiList')) {
        fetchReservasi();
    }

    // Function untuk mengambil data kontak (jika diperlukan)
    function fetchKontak() {
        const kontakList = document.getElementById('kontakList');
        if (!kontakList) return;

        fetch('/kontakkami')
            .then(response => response.json())
            .then(kontaks => {
                kontakList.innerHTML = '';
                kontaks.forEach(kontak => {
                    const kontakItem = document.createElement('div');
                    kontakItem.innerHTML = `
                        <strong>Nama:</strong> ${kontak.nama}<br>
                        <strong>Email:</strong> ${kontak.alamatEmail}<br>
                        <strong>Subject:</strong> ${kontak.subject}<br>
                        <strong>Message:</strong> ${kontak.message}<br><br>
                    `;
                    kontakList.appendChild(kontakItem);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Jalankan fetchKontak hanya jika elemen dengan id 'kontakList' ada di halaman
    if (document.getElementById('kontakList')) {
        fetchKontak();
    }
});