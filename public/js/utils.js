function cleanMobileNumberById(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  let value = input.value.trim().replace(/\s+/g, '');

  if (value.startsWith('+91')) {
    value = value.slice(3);
  } else if (value.startsWith('91') && value.length === 12) {
    value = value.slice(2);
  }

  input.value = value;
}
