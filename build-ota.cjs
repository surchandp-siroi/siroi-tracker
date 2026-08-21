const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const packageJson = require('./package.json');

const DIST_DIR = path.join(__dirname, 'dist');
const OTA_DIR = path.join(__dirname, 'dist-ota');
const ZIP_FILE = path.join(OTA_DIR, 'update.zip');
const VERSION_FILE = path.join(OTA_DIR, 'version.json');

// Replace this with your actual public hosting URL later
const HOST_URL = 'https://mis.siroiforex.com';

async function buildOta() {
  if (!fs.existsSync(OTA_DIR)) {
    fs.mkdirSync(OTA_DIR);
  }

  const version = packageJson.version;
  console.log(`Building OTA update for version ${version}...`);

  // 1. Create version.json
  const versionData = {
    version: version,
    url: `${HOST_URL}/update.zip`
  };
  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
  console.log(`Created version.json`);

  // 2. Zip the dist folder
  const zip = new AdmZip();
  zip.addLocalFolder(DIST_DIR);
  zip.writeZip(ZIP_FILE);

  console.log(`Created update.zip successfully`);
  console.log(`\n✅ OTA Build Complete!`);
  console.log(`Upload the contents of the 'dist-ota' folder to your web host.`);
}

buildOta().catch(console.error);
