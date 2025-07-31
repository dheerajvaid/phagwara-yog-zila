// utils/formatters.js

// ✅ Convert to Title Case (for Zila, Ksheter, Kender, etc.)
exports.formatName = (input) => {
  if (!input || typeof input !== "string") return "";

  return input
    .trim()
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// ✅ Validate Name — alphabets + space only by default
// Optionally allow numbers and custom characters
exports.validateName = (name, allowNumbers = false, allowedChars = "") => {
  const trimmedName = name.trim();

  // Escape special regex characters in allowedChars
  const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  // Base character set: alphabets and space
  let charSet = "A-Za-z\\s";

  // Add numbers if allowed
  if (allowNumbers) {
    charSet += "0-9";
  }

  // Add escaped custom allowed characters
  if (allowedChars) {
    charSet += escapeRegex(allowedChars);
  }

  const pattern = new RegExp(`^[${charSet}]+$`);
  return pattern.test(trimmedName);
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
