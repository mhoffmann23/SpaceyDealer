const fs = require('fs');
const path = require('path');

const projectDir = "C:\\Users\\hoffmannm23\\Desktop\\Projects\\SpaceyMiner";
const publicDir = path.join(projectDir, "public");
const indexFile = path.join(projectDir, "index.html");
const destinationFile = path.join(publicDir, "index.html");

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log("Created public directory");
} else {
    console.log("Public directory already exists");
}

// Move index.html to public directory
if (fs.existsSync(indexFile)) {
    fs.renameSync(indexFile, destinationFile);
    console.log("Moved index.html to public directory");
} else {
    console.log("index.html not found in current directory");
}

// Verify the file is in the public directory
if (fs.existsSync(destinationFile)) {
    const stats = fs.statSync(destinationFile);
    console.log(`✓ Verification successful: public/index.html exists (${stats.size} bytes)`);
    console.log(`  Location: ${destinationFile}`);
} else {
    console.log("✗ Verification failed: public/index.html not found");
}
