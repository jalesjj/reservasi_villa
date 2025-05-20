// Berikut adalah alternatif implementasi jika API tetap tidak berfungsi
// Salin kode ini ke file ketersediaan-fallback.js jika diperlukan

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const checkAvailabilityForm = document.getElementById('checkAvailabilityForm');
  const checkInDateInput = document.getElementById('checkInDate');
  const checkOutDateInput = document.getElementById('checkOutDate');
  
  // Set default values: Today and Tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Format dates as YYYY-MM-DD for input fields
  checkInDateInput.value = formatDateForInput(today);
  checkOutDateInput.value = formatDateForInput(tomorrow);
  
  // Set minimum dates (can't check dates in the past)
  checkInDateInput.min = formatDateForInput(today);
  checkOutDateInput.min = formatDateForInput(tomorrow);
  
  // When check-in date changes, update minimum for check-out date
  checkInDateInput.addEventListener('change', function() {
    const newMinDate = new Date(this.value);
    newMinDate.setDate(newMinDate.getDate() + 1);
    checkOutDateInput.min = formatDateForInput(newMinDate);
    
    // If current check-out date is before new minimum, update it
    if (new Date(checkOutDateInput.value) <= new Date(this.value)) {
      checkOutDateInput.value = formatDateForInput(newMinDate);
    }
  });
  
  // Handle form submission
  if (checkAvailabilityForm) {
    checkAvailabilityForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const checkInDate = checkInDateInput.value;
      const checkOutDate = checkOutDateInput.value;
      
      // Gunakan mode fallback untuk pengecekan ketersediaan
      simulateAvailabilityCheck(checkInDate, checkOutDate);
    });
  }
  
  // Initial check when the page loads
  simulateAvailabilityCheck(checkInDateInput.value, checkOutDateInput.value);
  
  // Function to simulate availability check without API
  function simulateAvailabilityCheck(checkInDate, checkOutDate) {
    document.querySelectorAll('.villa-status').forEach(el => {
      el.innerHTML = '<p><i class="fas fa-spinner fa-spin status-icon"></i> Sedang memeriksa ketersediaan...</p>';
    });
    
    // Simulate network delay
    setTimeout(() => {
      // Gunakan data statis untuk demo
      const simulatedData = generateSimulatedData(checkInDate, checkOutDate);
      
      // Perbarui UI dengan hasil
      updateVillaAvailability(simulatedData, checkInDate, checkOutDate);
    }, 800);
  }
  
  // Function to update villa availability display
  function updateVillaAvailability(data, checkInDate, checkOutDate) {
    // Format dates for display (DD/MM/YYYY)
    const formattedCheckIn = formatDateForDisplay(checkInDate);
    const formattedCheckOut = formatDateForDisplay(checkOutDate);
    
    // Update each villa's status
    updateVillaStatus('vilaJalesStatus', 'Villa Jales', data.vilajales, formattedCheckIn, formattedCheckOut);
    updateVillaStatus('vilaAkmalStatus', 'Villa Akmal', data.vilaakmal, formattedCheckIn, formattedCheckOut);
    updateVillaStatus('vilaRizaldiStatus', 'Villa Rizaldi', data.vilarizaldi, formattedCheckIn, formattedCheckOut);
  }
  
  // Update individual villa status display
  function updateVillaStatus(elementId, villaName, isAvailable, checkInDate, checkOutDate) {
    const statusElement = document.getElementById(elementId);
    
    if (!statusElement) return;
    
    // Clear previous status
    statusElement.innerHTML = '';
    statusElement.className = 'villa-status';
    
    if (isAvailable) {
      // Villa is available
      statusElement.classList.add('status-available');
      statusElement.innerHTML = `
        <p><i class="fas fa-check-circle status-icon"></i> Tersedia untuk tanggal ${checkInDate} sampai ${checkOutDate}</p>
      `;
    } else {
      // Villa is not available
      statusElement.classList.add('status-unavailable');
      statusElement.innerHTML = `
        <p><i class="fas fa-times-circle status-icon"></i> Tidak tersedia untuk tanggal ${checkInDate} sampai ${checkOutDate}</p>
      `;
    }
  }
  
  // Helper function to format date for input fields (YYYY-MM-DD)
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Helper function to format date for display (DD/MM/YYYY)
  function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Function untuk menghasilkan data simulasi
  function generateSimulatedData(checkInDate, checkOutDate) {
    // Convert dates to timestamps for easier comparison
    const checkIn = new Date(checkInDate).getTime();
    
    // Waktu booking tetap untuk demo
    const bookedDates = {
      'vilaJales': [
        { start: new Date('2025-05-21').getTime(), end: new Date('2025-05-23').getTime() },
        { start: new Date('2025-05-28').getTime(), end: new Date('2025-05-30').getTime() }
      ],
      'vilaAkmal': [
        { start: new Date('2025-05-18').getTime(), end: new Date('2025-05-20').getTime() },
        { start: new Date('2025-05-25').getTime(), end: new Date('2025-05-27').getTime() }
      ],
      'vilaRizaldi': [
        { start: new Date('2025-05-15').getTime(), end: new Date('2025-05-18').getTime() },
        { start: new Date('2025-06-01').getTime(), end: new Date('2025-06-05').getTime() }
      ]
    };
    
    // Check if requested dates overlap with any booked periods
    function isAvailable(villaBookings) {
      for (const booking of villaBookings) {
        if (checkIn >= booking.start && checkIn <= booking.end) {
          return false;
        }
      }
      return true;
    }
    
    // Return availability status for each villa
    return {
      vilajales: isAvailable(bookedDates.vilaJales),
      vilaakmal: isAvailable(bookedDates.vilaAkmal),
      vilarizaldi: isAvailable(bookedDates.vilaRizaldi)
    };
  }
});