// 📅 Check if birthday today
exports.isBirthdayToday = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
  
    return (today.getDate() === birthDate.getDate() &&
            today.getMonth() === birthDate.getMonth());
  };
  
  // 📅 Check if anniversary today
  exports.isAnniversaryToday = (marriageDate) => {
    if (!marriageDate) return false;
  
    const today = new Date();
    const annivDate = new Date(marriageDate);
  
    return (today.getDate() === annivDate.getDate() &&
            today.getMonth() === annivDate.getMonth());
  };
  