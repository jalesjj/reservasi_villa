// ==============================
// DIAGNOSTIK SCRIPT
// ==============================
// Salin kode berikut ke file diagnostic.js dan jalankan dengan node diagnostic.js 
// untuk mengecek koneksi database dan struktur tabel

const oracledb = require('oracledb');

// Konfigurasi Oracle - GUNAKAN KREDENSIAL YANG SAMA DENGAN APLIKASI UTAMA
const dbConfig = {
  user: 'C##JALES',
  password: 'jales123',
  connectString: 'localhost/orcl' // Ganti sesuai SID/Service Name
};

async function runDiagnostics() {
  let connection;
  
  try {
    console.log('=== MEMULAI DIAGNOSTIK DATABASE ===');
    
    // Test 1: Koneksi ke database
    console.log('\n[TEST 1] Mencoba koneksi ke database...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Koneksi ke database berhasil');
    
    // Test 2: Cek apakah tabel RESERVASI ada
    console.log('\n[TEST 2] Memeriksa keberadaan tabel RESERVASI...');
    const tableCheckResult = await connection.execute(
      `SELECT COUNT(*) AS TABLE_EXISTS FROM USER_TABLES WHERE TABLE_NAME = 'RESERVASI'`
    );
    
    if (tableCheckResult.rows[0][0] > 0) {
      console.log('✅ Tabel RESERVASI ditemukan');
      
      // Test 3: Cek struktur tabel
      console.log('\n[TEST 3] Memeriksa struktur tabel RESERVASI...');
      const columnResult = await connection.execute(
        `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'RESERVASI'`
      );
      
      console.log('Informasi Kolom:');
      columnResult.rows.forEach(col => {
        console.log(`- ${col[0]} (${col[1]}${col[1] === 'VARCHAR2' ? `(${col[2]})` : ''})`);
      });
      
      // Test 4: Cek jumlah data dalam tabel
      console.log('\n[TEST 4] Memeriksa jumlah data dalam tabel RESERVASI...');
      const countResult = await connection.execute(
        `SELECT COUNT(*) AS TOTAL FROM RESERVASI`
      );
      
      const totalRows = countResult.rows[0][0];
      console.log(`✅ Jumlah data: ${totalRows} baris`);
      
      if (totalRows > 0) {
        // Test 5: Mengambil sampel data
        console.log('\n[TEST 5] Mengambil sampel data reservasi...');
        const sampleResult = await connection.execute(
          `SELECT 
             pilihanVila, 
             TO_CHAR(checkIn, 'YYYY-MM-DD') AS checkIn, 
             TO_CHAR(checkOut, 'YYYY-MM-DD') AS checkOut 
           FROM RESERVASI 
           WHERE ROWNUM <= 5`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        console.log('Sampel Data:');
        sampleResult.rows.forEach((row, i) => {
          console.log(`[${i+1}] ${row.PILIHANVILA}: ${row.CHECKIN} s/d ${row.CHECKOUT}`);
        });
        
        // Test 6: Tes query pencarian overlap
        console.log('\n[TEST 6] Menguji query pencarian overlap tanggal...');
        const testDate1 = '2025-05-20';
        const testDate2 = '2025-05-25';
        
        const overlapResult = await connection.execute(
          `SELECT pilihanVila, 
             TO_CHAR(checkIn, 'YYYY-MM-DD') AS checkIn, 
             TO_CHAR(checkOut, 'YYYY-MM-DD') AS checkOut 
           FROM reservasi 
           WHERE 
           (TO_DATE(:checkInDate, 'YYYY-MM-DD') BETWEEN checkIn AND checkOut - 1)
           OR
           (TO_DATE(:checkOutDate, 'YYYY-MM-DD') - 1 BETWEEN checkIn AND checkOut - 1)
           OR
           (checkIn BETWEEN TO_DATE(:checkInDate, 'YYYY-MM-DD') AND TO_DATE(:checkOutDate, 'YYYY-MM-DD') - 1)`,
          { checkInDate: testDate1, checkOutDate: testDate2 },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        console.log(`Hasil pencarian overlap untuk tanggal ${testDate1} s/d ${testDate2}:`);
        if (overlapResult.rows.length > 0) {
          overlapResult.rows.forEach((row, i) => {
            console.log(`[${i+1}] ${row.PILIHANVILA}: ${row.CHECKIN} s/d ${row.CHECKOUT}`);
          });
        } else {
          console.log('Tidak ada overlap ditemukan untuk tanggal tersebut');
        }
      }
    } else {
      console.log('❌ Tabel RESERVASI tidak ditemukan');
      console.log('Rekomendasi: Buat tabel dengan menjalankan script create_reservasi_table.sql');
    }
    
    console.log('\n=== DIAGNOSTIK SELESAI ===');
    
  } catch (error) {
    console.error('❌ ERROR saat diagnostik:', error);
    console.log('\nSaran troubleshooting:');
    
    if (error.message.includes('ORA-12541') || error.message.includes('DPI-1047')) {
      console.log('- Periksa apakah database Oracle sedang berjalan');
      console.log('- Periksa connectString (biasanya localhost/orcl atau localhost:1521/orcl)');
    }
    
    if (error.message.includes('ORA-01017')) {
      console.log('- Username atau password Oracle salah');
      console.log('- Pastikan kredensial benar dan user memiliki hak akses yang cukup');
    }
    
    if (error.message.includes('ORA-00942')) {
      console.log('- Tabel RESERVASI tidak ada atau user tidak memiliki akses');
      console.log('- Jalankan create_reservasi_table.sql untuk membuat tabel');
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Koneksi ke database ditutup');
      } catch (err) {
        console.error('Error saat menutup koneksi:', err);
      }
    }
  }
}

// Jalankan diagnostik
runDiagnostics();