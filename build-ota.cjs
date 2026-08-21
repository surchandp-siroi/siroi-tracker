const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const packageJson = require('./package.json');

const DIST_DIR = path.join(__dirname, 'dist');
const OTA_DIR = path.join(__dirname, 'dist');
const VERSION_FILE = path.join(OTA_DIR, 'version.json');
const HOST_URL = 'https://mis.siroiforex.com';

async function buildOta() {
  if (!fs.existsSync(OTA_DIR)) {
    fs.mkdirSync(OTA_DIR, { recursive: true });
  }
  const tempDir = path.join(__dirname, 'dist-ota');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Remove existing zip files in dist to prevent bundling old zips
  if (fs.existsSync(DIST_DIR)) {
    const existingZips = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.zip'));
    for (const zf of existingZips) {
      try { fs.unlinkSync(path.join(DIST_DIR, zf)); } catch {}
    }
  }

  const version = packageJson.version;
  const zipFileName = `bundle-v${version}.zip`;
  const finalZipPath = path.join(OTA_DIR, zipFileName);

  console.log(`Building OTA update for version ${version} (${zipFileName})...`);

  // 2. Zip the dist folder (excluding mp4 videos to keep OTA bundle ultra fast ~2.6 MB)
  const zip = new AdmZip();
  const files = fs.readdirSync(DIST_DIR);
  for (const file of files) {
    if (file.endsWith('.mp4') || file.endsWith('.zip') || file === 'version.json') continue;
    const fullPath = path.join(DIST_DIR, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      zip.addLocalFolder(fullPath, file);
    } else {
      zip.addLocalFile(fullPath);
    }
  }
  
  // Save to temporary location first
  const tempZipPath = path.join(tempDir, zipFileName);
  zip.writeZip(tempZipPath);
  
  // Move to dist directory
  fs.renameSync(tempZipPath, finalZipPath);
  
  const versionData = {
    version: version,
    url: `${HOST_URL}/dist/${zipFileName}`
  };
  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));

  console.log(`Created ${zipFileName} and version.json in dist/ successfully`);
  console.log(`\n✅ OTA Build Complete!`);
}

buildOta().catch(console.error);
