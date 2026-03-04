const fs = require('fs');
const path = require('path');

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✓ Created public directory');
}

// Read original index.html
const originalIndex = path.join(__dirname, 'index.html');
const newIndex = path.join(publicDir, 'index.html');

if (fs.existsSync(originalIndex)) {
    const content = fs.readFileSync(originalIndex, 'utf8');
    fs.writeFileSync(newIndex, content);
    fs.unlinkSync(originalIndex);
    console.log('✓ Moved index.html to public directory');
} else if (!fs.existsSync(newIndex)) {
    console.log('✗ index.html not found in either location');
}

// Verify structure
console.log('\nDirectory structure:');
console.log('  public/');
if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    files.forEach(f => console.log(`    - ${f}`));
}
