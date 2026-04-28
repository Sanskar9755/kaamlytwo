#!/bin/bash
set -e

echo "=============================="
echo " KaamlyTwo - Contabo Deploy"
echo " Domain: shanky.life"
echo "=============================="

# 1. Node.js 20
echo "[1/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. PM2 + Nginx
echo "[2/7] Installing PM2 and Nginx..."
sudo npm install -g pm2
sudo apt install nginx -y

# 3. Backend setup
echo "[3/7] Setting up backend..."
cd /var/www/kaamlytwo/backend
npm install --production
node src/db/init.js

# 4. Start backend with PM2
echo "[4/7] Starting backend with PM2..."
pm2 delete kaamlytwo-backend 2>/dev/null || true
pm2 start src/index.js --name kaamlytwo-backend
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

# 5. Frontend build
echo "[5/7] Building frontend..."
cd /var/www/kaamlytwo/frontend
npm install
npm run build

# 6. Nginx config
echo "[6/7] Configuring Nginx..."
sudo cp /var/www/kaamlytwo/nginx.conf /etc/nginx/sites-available/kaamlytwo
sudo ln -sf /etc/nginx/sites-available/kaamlytwo /etc/nginx/sites-enabled/kaamlytwo
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 7. SSL with Certbot
echo "[7/7] Installing SSL certificates..."
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d shanky.life -d www.shanky.life -d api.shanky.life --non-interactive --agree-tos -m admin@shanky.life

echo ""
echo "=============================="
echo " Deploy complete!"
echo " Frontend: https://shanky.life"
echo " Backend:  https://api.shanky.life"
echo "=============================="
