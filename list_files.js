const fs = require('fs');
const path = require('path');

function listFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        console.log(`[DIR]  ${fullPath}`);
        if (file !== 'node_modules' && file !== '.git') {
            listFiles(fullPath);
        }
      } else {
        console.log(`[FILE] ${fullPath}`);
      }
    });
  } catch (err) {
    console.error(`Error reading ${dir}: ${err.message}`);
  }
}

listFiles(__dirname);
