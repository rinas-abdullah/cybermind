#!/usr/bin/env node

/**
 * رِسَاق (Risaq) Production Build Script
 *
 * Produces a `dist/` that mirrors the repo's own layout (frontend/, css/,
 * js/, backend/, index.html) so the real backend/server.js — copied
 * unmodified — resolves its static paths (path.resolve(__dirname, "..") +
 * frontend/pages, css, js) correctly without needing a second, different
 * server implementation.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

console.log('Building رِسَاق for production...\n');

// Clean existing dist
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing dist folder...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

console.log('Creating dist folder...');
fs.mkdirSync(distDir, { recursive: true });

// Recursive copy function
const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;

  fs.readdirSync(src).forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

console.log('Copying frontend files (frontend/, css/, js/, index.html)...');
copyDir(path.join(__dirname, 'frontend'), path.join(distDir, 'frontend'));
copyDir(path.join(__dirname, 'css'), path.join(distDir, 'css'));
copyDir(path.join(__dirname, 'js'), path.join(distDir, 'js'));
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));

console.log('Copying backend files...');
copyDir(path.join(__dirname, 'backend'), path.join(distDir, 'backend'));

console.log('Copying configuration files...');
const files = ['package.json', 'package-lock.json', '.env.example', 'README.md', 'setup_db.sql'];
files.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
});

// Build info — a plain data file, not a served page, so no branding
// consistency requirements beyond matching the rest of the app.
const buildInfo = {
  name: 'Risaq',
  buildDate: new Date().toISOString(),
  environment: 'production',
};

fs.writeFileSync(
  path.join(distDir, 'BUILD_INFO.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('\nBuild complete — output: ./dist');
console.log('Run: cd dist && npm install && npm start');
