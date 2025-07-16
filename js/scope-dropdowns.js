document.addEventListener('DOMContentLoaded', function () {
  const zilaDropdown = document.getElementById('zilaDropdown');
  const ksheterDropdown = document.getElementById('ksheterDropdown');
  const kenderDropdown = document.getElementById('kenderDropdown');

  zilaDropdown?.addEventListener('change', function () {
    const selectedZila = this.value;
    ksheterDropdown.innerHTML = '<option value="">Select Ksheter</option>';
    kenderDropdown.innerHTML = '<option value="">Select Kender</option>';
    ksheterDropdown.disabled = true;
    kenderDropdown.disabled = true;

    if (selectedZila && ksheterMap[selectedZila]) {
      ksheterMap[selectedZila].forEach(ksh => {
        const opt = document.createElement('option');
        opt.value = ksh._id;
        opt.textContent = ksh.name;
        ksheterDropdown.appendChild(opt);
      });
      ksheterDropdown.disabled = false;
    }
  });

  ksheterDropdown?.addEventListener('change', function () {
    const selectedKsheter = this.value;
    kenderDropdown.innerHTML = '<option value="">Select Kender</option>';
    kenderDropdown.disabled = true;

    if (selectedKsheter && kenderMap[selectedKsheter]) {
      kenderMap[selectedKsheter].forEach(kndr => {
        const opt = document.createElement('option');
        opt.value = kndr._id;
        opt.textContent = kndr.name;
        kenderDropdown.appendChild(opt);
      });
      kenderDropdown.disabled = false;
    }
  });
});
