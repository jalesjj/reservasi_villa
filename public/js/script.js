document.addEventListener('DOMContentLoaded', function () {
    // Form Reservasi
    const reservasiForm = document.getElementById('reservasiForm');

    reservasiForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(reservasiForm);
        const data = {
            nama: formData.get('nama'),
            alamat: formData.get('alamat'),
            alamatEmail: formData.get('alamatEmail'),
            nomorHP: formData.get('nomorHP'),
            jumlahOrang: formData.get('jumlahOrang'),
            checkIn: formData.get('checkIn'),
            jamCheckIn: formData.get('jamCheckIn'),
            checkOut: formData.get('checkOut'),
            jamCheckOut: formData.get('jamCheckOut')
        };

        fetch('/reservasi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.text())
            .then(message => {
                alert(message);
                reservasiForm.reset();
                fetchReservasi();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    const reservasiList = document.getElementById('reservasiList');

    function fetchReservasi() {
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
                        <strong>Check Out:</strong> ${reservasi.checkOut} ${reservasi.jamCheckOut}<br><br>
                    `;
                    reservasiList.appendChild(reservasiItem);
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    fetchReservasi();

    // Form Kontak
    const kontakForm = document.getElementById('kontakForm');

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
            .then(response => response.text())
            .then(message => {
                alert(message);
                kontakForm.reset();
                fetchKontak();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    const kontakList = document.getElementById('kontakList');

    function fetchKontak() {
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

    fetchKontak();
});
