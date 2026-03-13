import fs from 'fs';
import path from 'path';

// Create directories
const dirs = ['src/lib/db', 'server', 'src/pages'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('Directories created.');
