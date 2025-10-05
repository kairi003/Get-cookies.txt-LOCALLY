#!/usr/bin/env node

const fs = require('node:fs');
const process = require('node:process');
const path = require('node:path');
const archiver = require('archiver');
const { execSync } = require('node:child_process');
const { program } = require('commander');

const ROOT = path.join(__dirname, '..');

const options = program
  .option('-f --firefox', 'Build for Firefox')
  .parse(process.argv)
  .opts();

const getGitVersion = () => execSync('git describe --tags').toString().trim();

const build = async (version) => {
  const mode = options.firefox ? 'firefox' : 'chrome';
  const zipName = `get-cookies.txt-locally_${version}_${mode}.zip`;
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.createWriteStream(path.join(ROOT, 'dist', zipName));

  process.chdir(path.join(ROOT, 'src'));

  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  archive.pipe(output);
  archive.glob('**/*', { ignore: ['manifest*.json'] });

  const manifest = JSON.parse(fs.readFileSync('manifest.json'));
  if (options.firefox) {
    const manifestFirefox = JSON.parse(
      fs.readFileSync('manifest-firefox.json'),
    );
    Object.assign(manifest, manifestFirefox);
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  archive.finalize();
  console.log('BUILD', zipName);
};

build(getGitVersion());
