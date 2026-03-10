const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created public directory');
}

// Read index.html from current directory
const indexPath = path.join(__dirname, 'index.html');
const publicIndexPath = path.join(publicDir, 'index.html');

if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(publicIndexPath, content);
    console.log('Copied index.html to public directory');
    
    // Delete the original file
    fs.unlinkSync(indexPath);
    console.log('Deleted original index.html');
    
    // Verify
    if (fs.existsSync(publicIndexPath)) {
        console.log('Verification successful: public/index.html exists');
    }
} else {
    console.log('index.html not found in current directory');
}
