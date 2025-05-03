// 📋 Validate Mobile (Indian format 10 digits starting 6-9)
exports.validateMobile = (mobile) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(mobile);
  };
  
  // 📋 Validate Name (only alphabets and spaces)
  exports.validateName = (name) => {
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name.trim());
  };
  
  // 📋 Validate DOB (must be a past date)
  exports.validateDOB = (dob) => {
    const inputDate = new Date(dob);
    const today = new Date();
    return inputDate < today;
  };
  
  // 📋 Validate Date Format (General)
  exports.validateDate = (date) => {
    return !isNaN(new Date(date).getTime());
  };
  