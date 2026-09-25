#!/bin/bash
# ============================================
# QUATAVA — One-Command VPS Deployment Script
# ============================================
# Run this on a fresh Ubuntu 22.04/24.04 VPS
# Usage: curl -sSL <your-url>/deploy.sh | bash
# Or: chmod +x deploy.sh && sudo ./deploy.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[QUATAVA]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   err "This script must be run as root (use sudo)"
fi

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="/home/$DEPLOY_USER/quatava"

log "Starting Quatava deployment..."
log "Deploy user: $DEPLOY_USER"
log "App directory: $APP_DIR"

# ============================================
# STEP 1: System Setup
# ============================================
log "Step 1/12: Updating system..."
apt update && apt upgrade -y

# Create deploy user if not exists
if ! id "$DEPLOY_USER" &>/dev/null; then
    log "Creating deploy user..."
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
fi

# Install dependencies
log "Step 2/12: Installing system dependencies..."
apt install -y \
    build-essential g++ python3 python-is-python3 \
    libtool-bin autoconf automake \
    git curl wget unzip jq \
    redis-server \
    nginx \
    ufw fail2ban

# ============================================
# STEP 2: Firewall
# ============================================
log "Step 3/12: Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ============================================
# STEP 3: Start Services
# ============================================
log "Step 4/12: Starting Redis..."
systemctl enable --now redis-server

# ============================================
# STEP 5: Install Node.js
# ============================================
log "Step 6/12: Installing Node.js 22..."
su - $DEPLOY_USER -c '
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    nvm install 22 --lts
    nvm alias default 22
    corepack enable
    corepack prepare pnpm@10.15.0 --activate
    echo "Node: $(node --version)"
    echo "pnpm: $(pnpm --version)"
'

# ============================================
# STEP 6: Install PM2
# ============================================
log "Step 7/12: Installing PM2..."
su - $DEPLOY_USER -c 'npm install -g pm2'

# ============================================
# STEP 7: Clone & Install App
# ============================================
log "Step 8/12: Cloning repository..."
su - $DEPLOY_USER -c "
    cd ~
    if [ -d 'quatava' ]; then
        cd quatava && git pull
    else
        git clone https://github.com/gorefilip20/quatava4.git quatava
    fi
    cd quatava
    
    # Create .npmrc
    cat > .npmrc << 'NPMRC'
network-timeout=600000
fetch-retries=10
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
prefer-offline=true
auto-install-peers=true
NPMRC

    # Copy example env
    cp .env.example .env
"

# ============================================
# STEP 8: Configure .env
# ============================================
log "Step 9/12: Configuring environment..."

# Generate secrets
JWT_ACCESS=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_RESET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_VERIFY=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

su - $DEPLOY_USER -c "
    cd ~/quatava
    sed -i 's|APP_ACCESS_TOKEN_SECRET=.*|APP_ACCESS_TOKEN_SECRET=\"$JWT_ACCESS\"|' .env
    sed -i 's|APP_REFRESH_TOKEN_SECRET=.*|APP_REFRESH_TOKEN_SECRET=\"$JWT_REFRESH\"|' .env
    sed -i 's|APP_RESET_TOKEN_SECRET=.*|APP_RESET_TOKEN_SECRET=\"$JWT_RESET\"|' .env
    sed -i 's|APP_VERIFY_TOKEN_SECRET=.*|APP_VERIFY_TOKEN_SECRET=\"$JWT_VERIFY\"|' .env
    sed -i 's|ENCRYPTION_KEY_PASSPHRASE=.*|ENCRYPTION_KEY_PASSPHRASE=\"$ENCRYPTION_KEY\"|' .env
    sed -i 's|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"http://$SERVER_IP\"|' .env
    sed -i 's|NODE_ENV=.*|NODE_ENV=\"production\"|' .env
    sed -i 's|NEXT_PUBLIC_BACKEND_URL=.*|NEXT_PUBLIC_BACKEND_URL=\"http://127.0.0.1:4000\"|' .env
    sed -i 's|PGSSLMODE=.*|PGSSLMODE=\"require\"|' .env
    sed -i 's|DB_SSL=.*|DB_SSL=\"true\"|' .env
    sed -i 's|DB_CONNECT_TIMEOUT_MS=.*|DB_CONNECT_TIMEOUT_MS=\"10000\"|' .env
    echo \"IMPORTANT: set DATABASE_URL to the Supabase PostgreSQL connection string in ~/quatava/.env before starting the application.\"
    chmod 600 .env
"

# ============================================
# STEP 9: Install & Build
# ============================================
log "Step 10/12: Installing dependencies and building (this takes 5-15 minutes)..."
su - $DEPLOY_USER -c "
    cd ~/quatava
    NODE_OPTIONS='--max-old-space-size=4096' CI=1 pnpm install --no-frozen-lockfile --reporter=append-only
    PYTHON=python3 pnpm rebuild
    NODE_OPTIONS='--max-old-space-size=4096' pnpm build:all
"

# ============================================
# STEP 10: Seed Database
# ============================================
log "Step 11/12: Seeding database..."
su - $DEPLOY_USER -c "cd ~/quatava && pnpm seed"

# ============================================
# STEP 11: Configure Nginx
# ============================================
log "Step 12/12: Configuring Nginx..."
cat > /etc/nginx/sites-available/quatava << 'NGINX'
upstream quatava_frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream quatava_backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 25M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location /api/ {
        proxy_pass http://quatava_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_buffering off;
    }

    location /uploads/ {
        proxy_pass http://quatava_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /_next/static/ {
        proxy_pass http://quatava_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://quatava_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/quatava /etc/nginx/sites-enabled/quatava
nginx -t && systemctl reload nginx

# ============================================
# STEP 12: Start Application
# ============================================
su - $DEPLOY_USER -c "
    cd ~/quatava
    pm2 start production.config.js --env production
    pm2 save
    pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER 2>/dev/null || true
"

# ============================================
# DONE
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}🎉 QUATAVA DEPLOYMENT COMPLETE!${NC}"
echo "============================================"
echo ""
echo "🌐 URL:          http://$SERVER_IP"
echo "📧 Admin Email:  superadmin@example.com"
echo "🔑 Admin Pass:   (check /home/$DEPLOY_USER/.db-credentials)"
echo ""
echo "📋 Next steps:"
echo "   1. Visit http://$SERVER_IP/en/login"
echo "   2. Login with superadmin@example.com"
echo "   3. Change the admin password immediately"
echo "   4. Configure your .env with real API keys"
echo "   5. Set up a domain + SSL (see DEPLOY.md)"
echo ""
echo "📂 App location: /home/$DEPLOY_USER/quatava"
echo "📊 Logs:         pm2 logs"
echo "🔄 Restart:      pm2 restart all"
echo "============================================"
