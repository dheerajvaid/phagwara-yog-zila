const { validateMobile, validateName, validateDOB } = require('../utils/validators');

if (!validateMobile(mobile)) {
  return res.send('❌ Invalid Mobile Number');
}

if (!validateName(name)) {
  return res.send('❌ Name should contain only alphabets and spaces');
}

if (!validateDOB(dob)) {
  return res.send('❌ Date of Birth must be a valid past date');
}
