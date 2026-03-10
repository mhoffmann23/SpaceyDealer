import os
import shutil
from pathlib import Path

# Define paths
project_dir = Path("C:\\Users\\hoffmannm23\\Desktop\\Projects\\SpaceyMiner")
public_dir = project_dir / "public"
index_file = project_dir / "index.html"
destination_file = public_dir / "index.html"

# Create public directory if it doesn't exist
if not public_dir.exists():
    public_dir.mkdir(parents=True, exist_ok=True)
    print("Created public directory")
else:
    print("Public directory already exists")

# Move index.html to public directory
if index_file.exists():
    shutil.move(str(index_file), str(destination_file))
    print("Moved index.html to public directory")
else:
    print("index.html not found in current directory")

# Verify the file is in the public directory
if destination_file.exists():
    file_size = destination_file.stat().st_size
    print(f"✓ Verification successful: public/index.html exists ({file_size} bytes)")
    print(f"  Location: {destination_file}")
else:
    print("✗ Verification failed: public/index.html not found")
