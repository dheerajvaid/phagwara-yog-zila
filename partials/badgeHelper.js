module.exports = function getBadgeColor(role) {
    const colors = {
      'Admin': 'danger',
      'Zila Pradhan': 'success',
      'Zila Mantri': 'success',
      'Sangathan Mantri': 'warning',
      'Cashier': 'secondary',
      'Ksheter Pradhan': 'info',
      'Ksheter Mantri': 'info',
      'Kender Pramukh': 'primary',
      'Seh Kender Pramukh': 'primary',
      'Shikshak': 'dark',
      'Karyakarta': 'secondary',
      'Saadhak': 'light'
    };
  
    return colors[role] || 'primary';
  };
  