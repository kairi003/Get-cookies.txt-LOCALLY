const fs = require('node:fs');
const path = require('node:path');
const { program } = require('commander');

const ROOT = path.join(__dirname, '..');
const PACKAGE_PATH = path.resolve(ROOT, 'package.json');
const MANIFEST_PATH = path.resolve(ROOT, 'src', 'manifest.json');

const options = program
  .option('-f --fix', 'Fix version mismatch by updating manifest.json')
  .parse(process.argv)
  .opts();

const latest = (ver1, ver2) => {
  // return the latest of two semver strings

  // if one is missing, return the other
  if (!ver1) return ver2;
  if (!ver2) return ver1;

  // simple semver comparison (major.minor.patch)
  // assumes valid semver strings
  const part1 = ver1.split('.').map(Number);
  const part2 = ver2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const n1 = part1[i] ?? 0;
    const n2 = part2[i] ?? 0;
    if (n1 > n2) return ver1;
    if (n1 < n2) return ver2;
  }
  return ver1; // equal
};

try {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  const pkgVer = pkg.version;
  const man = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const manVer = man.version;

  if (pkgVer === manVer) {
    console.log(`✅ Versions are in sync: ${pkgVer}`);
    process.exit(0);
  }

  console.warn(
    `⚠️ Version mismatch: package.json:${pkgVer} vs manifest.json:${manVer}`,
  );

  // check mode: exit with error
  if (!options.fix) {
    console.error('❌ Check failed: Versions are not in sync.');
    process.exit(1);
  }

  // fix mode: fix to the latest version
  const latestVersion = latest(pkgVer, manVer);
  pkg.version = latestVersion;
  fs.writeFileSync(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2).trim()}\n`);
  man.version = latestVersion;
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(man, null, 2).trim()}\n`);
  console.log(`✅ Fixed versions to ${latestVersion}`);
  process.exit(0);
} catch (error) {
  console.error('An error occurred during version syncing:', error.message);
  process.exit(1);
}
