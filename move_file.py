#!/usr/bin/env python3
import os
import shutil

os.chdir(r'C:\Users\hoffmannm23\Desktop\Projects\SpaceyMiner')

# Create public directory
os.makedirs('public', exist_ok=True)
print('Public directory ensured')

# Move index.html to public directory
if os.path.exists('index.html'):
    shutil.move('index.html', os.path.join('public', 'index.html'))
    print('Successfully moved index.html to public/')
    print(f'File exists at: {os.path.exists("public/index.html")}')
else:
    print('ERROR: index.html not found')
