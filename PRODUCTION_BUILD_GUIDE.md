# CyberMind Production Build Guide

## 📦 Production Build Ready!

Your CyberMind platform has been built for production deployment. The `dist` folder contains everything you need to run the application on any server.

---

## 🎯 What You Get

### Complete Deployment Package
- ✅ Full frontend (HTML, CSS, JavaScript)
- ✅ Backend API server (Node.js/Express)
- ✅ All assets and resources
- ✅ Environment configuration
- ✅ Production-ready server entry point
- ✅ Deployment guides and documentation

### Build Contents
```
dist/
├── server.js              # Production server (main entry point)
├── package.json           # Dependencies
├── package-lock.json      # Locked versions
├── .env.example           # Configuration template
├── DEPLOYMENT.md          # Deployment instructions
├── BUILD_INFO.json        # Build metadata
├── README.md              # Project documentation
├── backend/               # API routes & services
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── data/
│   ├── constants/
│   └── config/
└── public/                # Static frontend files
    ├── pages/            # HTML pages
    │   ├── dashboard.html
    │   ├── training.html
    │   ├── terminal.html
    │   ├── leaderboard.html
    │   ├── admin.html
    │   └── auth.html
    ├── css/              # Stylesheets
    │   └── style.css
    ├── js/               # JavaScript
    │   ├── app.js
    │   ├── i18n.js
    │   ├── translations.js
    │   ├── components/
    │   └── utils/
    └── index.html        # Entry point router
```

---

## 🚀 Deployment Methods

### Method 1: Local Deployment (Testing)

1. **Navigate to dist folder**:
   ```bash
   cd dist
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start server**:
   ```bash
   npm start
   ```

4. **Access application**:
   ```
   http://localhost:3001
   ```

5. **Test with demo credentials**:
   - Username: `demo`
   - Password: `demo`

---

### Method 2: Heroku Deployment

1. **Create Procfile in dist folder**:
   ```bash
   echo "web: node server.js" > dist/Procfile
   ```

2. **Initialize git (if not already)**:
   ```bash
   cd dist
   git init
   git add .
   git commit -m "CyberMind production build"
   ```

3. **Login to Heroku**:
   ```bash
   heroku login
   ```

4. **Create app**:
   ```bash
   heroku create your-app-name
   ```

5. **Push to Heroku**:
   ```bash
   git push heroku main
   ```

6. **Open app**:
   ```bash
   heroku open
   ```

**Your site will be at**: `https://your-app-name.herokuapp.com`

---

### Method 3: AWS EC2 Deployment

1. **Launch EC2 instance** (Ubuntu 20.04, t2.micro for testing)

2. **Connect via SSH**:
   ```bash
   ssh -i key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Upload dist folder**:
   ```bash
   scp -r dist/* ec2-user@your-instance-ip:~
   ```

5. **Install and start**:
   ```bash
   npm install
   npm start
   ```

6. **Configure security group**:
   - Allow inbound: Port 3001 (or 80 for public)
   - Allow outbound: All

7. **Use reverse proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

### Method 4: Docker Deployment

1. **Create Dockerfile in dist**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN npm install --production
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. **Build image**:
   ```bash
   docker build -t cybermind .
   ```

3. **Run container**:
   ```bash
   docker run -p 3001:3001 -e NODE_ENV=production cybermind
   ```

4. **Deploy to Docker Hub**:
   ```bash
   docker tag cybermind your-username/cybermind
   docker push your-username/cybermind
   ```

---

### Method 5: Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy dist folder**:
   ```bash
   cd dist
   vercel
   ```

3. **For serverless API**, create `vercel.json`:
   ```json
   {
     "version": 2,
     "public": true,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

---

### Method 6: Azure App Service

1. **Create App Service** in Azure Portal

2. **Deploy via Git**:
   ```bash
   az webapp deployment source config-zip \
     --resource-group myGroup \
     --name myAppName \
     --src dist.zip
   ```

3. **Set environment variables**:
   ```bash
   az webapp config appsettings set \
     --resource-group myGroup \
     --name myAppName \
     --settings NODE_ENV=production PORT=8080
   ```

---

## 🌐 Hosting Services

### Free Options
- **Heroku** (limited free tier)
- **Railway** (free tier)
- **Render** (free tier)
- **Fly.io** (free tier)

### Paid Options
- **AWS** ($5-15/month for small app)
- **DigitalOcean** ($5-12/month)
- **Linode** ($5-10/month)
- **Google Cloud** (pay per use)
- **Azure** (pay per use)
- **Vercel** (generous free tier)
- **Netlify** (generous free tier)

---

## 🔧 Environment Configuration

Create `.env` file in dist folder:

```env
# Server
NODE_ENV=production
PORT=3001

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/cybermind
DB_TYPE=in-memory

# Security
JWT_SECRET=your-long-random-secret-key-here
SESSION_SECRET=another-long-random-key-here

# API Configuration
CORS_ORIGIN=https://your-domain.com
```

---

## ✅ Health Check

After deployment, verify the server is running:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "CyberMind backend is running",
  "timestamp": "2026-03-09T12:00:00Z",
  "data": {
    "port": 3001,
    "environment": "production",
    "uptime": 1234.5
  }
}
```

---

## 📊 Features Included

✅ **Adaptive Cybersecurity Training** - Interactive scenarios  
✅ **AI Mentor System** - Intelligent tutoring  
✅ **Terminal Lab Simulator** - CLI practice environment  
✅ **Leaderboard Rankings** - Competitive training  
✅ **Admin Dashboard** - User & platform management  
✅ **Professional Navigation** - Modern UI navbar  
✅ **Multi-language Support** - English & Arabic with RTL  
✅ **Session Management** - Persistent authentication  
✅ **Real-time Analytics** - User progress tracking  

---

## 🔐 Security Checklist

- [ ] Change default credentials (demo/demo)
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Set strong SESSION_SECRET (32+ characters)
- [ ] Enable HTTPS on production domain
- [ ] Set CORS_ORIGIN to your domain
- [ ] Update email configuration if needed
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure backups for database
- [ ] Implement DDoS protection
- [ ] Regular security updates

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Module Not Found
```bash
# Reinstall dependencies
npm install --production
```

### CORS Errors
Update CORS_ORIGIN in .env to match your domain

### Database Connection Failed
Switch to in-memory mode:
```env
DB_TYPE=in-memory
```

---

## 📈 Monitoring

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js -n "cybermind"
pm2 logs cybermind
pm2 save
```

### Systemd Service (Linux)
```ini
[Unit]
Description=CyberMind Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/app/dist
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 📞 Support & Documentation

- **Architecture**: See ARCHITECTURE.md
- **Quick Start**: See QUICK_START.md
- **Deployment**: See DEPLOYMENT.md in dist folder
- **Issues**: Check error logs

---

## 🎉 You're Ready!

Your CyberMind production build is ready to deploy. Choose your preferred hosting platform above and follow the deployment steps.

**Good luck with your deployment! 🚀**
