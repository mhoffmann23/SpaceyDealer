const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'));
    console.log('Created public directory');
}

if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    fs.renameSync(path.join(__dirname, 'index.html'), path.join(__dirname, 'public', 'index.html'));
    console.log('Moved index.html to public');
}
