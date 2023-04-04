const fs = require('fs');
const process = require('process');
const path = require('path');
const archiver = require('archiver');

const zipPath = `src.zip`;
const output = fs.createWriteStream(path.join(__dirname, zipPath));

process.chdir(path.join(__dirname, 'src'));

const archive = archiver('zip', {
  zlib: { level: 9 }
});

archive.pipe(output);
archive.glob('**/*');

archive.finalize();

