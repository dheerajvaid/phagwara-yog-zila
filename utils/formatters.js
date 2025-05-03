// utils/formatters.js

// ✅ Convert to Title Case (for Zila, Ksheter, Kender, etc.)
exports.formatName = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  
  // ✅ Validate Name — alphabets + spaces only
  exports.validateName = (name) => {
    return /^[A-Za-z\s]+$/.test(name.trim());
  };
  
  exports.validateMobile = (mobile) => {
    return /^[6-9]\d{9}$/.test(mobile.trim());
  };

  // ✅ Validate Date of Birth / Date — Must be a valid past date
exports.validateDate = (input) => {
    if (!input) return false;
  
    const date = new Date(input);
  
    // Check if input was convertible to Date
    if (isNaN(date.getTime())) return false;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time for exact day comparison
  
    return date < today;
  };

  exports.validateFutureDate = (input) => {
    const date = new Date(input);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    return !isNaN(date.getTime()) && date >= today;
  };