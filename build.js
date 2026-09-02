#!/usr/bin/env node

/**
 * CyberMind Production Build Script
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(distDir, 'public');

console.log('Building CyberMind for production...\n');

// Clean existing dist
if (fs.existsSync(distDir)) {
  console.log('Cleaning existing dist folder...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

console.log('Creating dist folder structure...');
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

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

console.log('Copying frontend files...');
copyDir(path.join(__dirname, 'frontend'), publicDir);
copyDir(path.join(__dirname, 'css'), path.join(publicDir, 'css'));
copyDir(path.join(__dirname, 'js'), path.join(publicDir, 'js'));

console.log('Copying backend files...');
fs.mkdirSync(path.join(distDir, 'backend'), { recursive: true });
copyDir(path.join(__dirname, 'backend'), path.join(distDir, 'backend'));

console.log('Copying configuration files...');
const files = ['package.json', 'package-lock.json', '.env.example', 'README.md'];
files.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
  }
});

// Create server.js
const serverCode = `#!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

const apiRoutes = require('./backend/routes/api');
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CyberMind backend is running',
    timestamp: new Date().toISOString(),
    data: {
      port: port,
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime()
    }
  });
});

app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(publicPath, 'pages', 'dashboard.html'));
  } catch (err) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(port, () => {
  console.log('\\n=== CyberMind Server ===');
  console.log('Port: ' + port);
  console.log('Mode: ' + (process.env.NODE_ENV || 'production'));
  console.log('');
});

module.exports = app;
`;

fs.writeFileSync(path.join(distDir, 'server.js'), serverCode);
console.log('Created production server');

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberMind - Loading...</title>
  <script>
    var token = localStorage.getItem('authToken');
    if (token) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth';
    }
  </script>
</head>
<body><p>Redirecting...</p></body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

// Create deployment guide
const deployGuide = `# CyberMind Production Build

## What's Included
- Complete frontend (HTML, CSS, JS)
- Backend API server
- All configuration files
- Production server

## Quick Start

1. Install dependencies:
   npm install

2. Start server:
   npm start

3. Access at: http://localhost:3001

Test credentials:
- Username: demo
- Password: demo

## Deployment

### Heroku
Create Procfile with: web: node server.js
Then push to Heroku

### AWS/Azure
1. Upload to server
2. Run: npm install && npm start
3. Configure domain

### Docker
Build and run Docker image from included Dockerfile

### Vercel/Netlify
Deploy 'public' folder as static site

## Features
- Cybersecurity Training Platform
- AI Mentor System
- Terminal Lab Simulator
- Leaderboard Rankings
- Admin Dashboard
- Multi-language Support (EN/AR with RTL)
- Professional Navigation
- Real-time Analytics

See ARCHITECTURE.md for system details.
`;

fs.writeFileSync(path.join(distDir, 'DEPLOYMENT.md'), deployGuide);
console.log('Created deployment guide');

// Create build info
const buildInfo = {
  name: 'CyberMind',
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  environment: 'production',
  features: [
    'Cybersecurity Training',
    'AI Mentor',
    'Terminal Lab',
    'Leaderboard',
    'Admin Dashboard',
    'Multi-language',
    'Navigation',
    'Analytics'
  ]
};

fs.writeFileSync(
  path.join(distDir, 'BUILD_INFO.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('Created build info');
console.log('\nBuild Complete!');
console.log('Output: ./dist');
console.log('Ready for deployment\n');
