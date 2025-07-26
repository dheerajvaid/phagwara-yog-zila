// utils/cleanupOldGreetings.js
const fs = require('fs');
const path = require('path');

const GREETING_DIR = path.join(__dirname, '..', 'public', 'greetings');
const ONE_HOUR = 60 * 60 * 1000; // in milliseconds

function cleanupOldGreetings() {
  fs.readdir(GREETING_DIR, (err, files) => {
    if (err) return console.error('Error reading greetings folder:', err);

    files.forEach(file => {
      const filePath = path.join(GREETING_DIR, file);

      fs.stat(filePath, (err, stats) => {
        if (err) return console.error('Error getting file stats:', err);

        const now = Date.now();
        const fileAge = now - stats.ctimeMs;

        if (fileAge > ONE_HOUR) {
          fs.unlink(filePath, err => {
            if (err) console.error('Error deleting file:', err);
            else console.log('Deleted old greeting:', file);
          });
        }
      });
    });
  });
}

module.exports = cleanupOldGreetings;
