const fs = require('fs');
const process = require('process');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');


const getBranch = () => new Promise((resolve, reject) => {
  exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
    if (typeof stdout === 'string') {
      resolve(stdout.trim());
    } else {
      reject(TypeError);
    }
  });
});


const build = async (name) => {
  const dt = new Date().toLocaleString('sv').replace(/\D/g, '');
  const zipPath = `${name}_${dt}.zip`;
  const output = fs.createWriteStream(path.join(__dirname, zipPath));

  process.chdir(path.join(__dirname, 'src'));

  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  archive.pipe(output);
  archive.glob('**/*');

  await archive.finalize();
  console.log('BUILD', zipPath);
}


getBranch().then(build);
