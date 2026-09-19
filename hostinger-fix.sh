#!/bin/bash
# ============================================
# QUATAVA — Hostinger VPS Domain Fix Script
# ============================================
# Fixes 403 Forbidden for getquatava.com
# Run on your Hostinger VPS as root:
#   chmod +x hostinger-fix.sh && sudo ./hostinger-fix.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[QUATAVA]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }

DOMAIN="getquatava.com"
DEPLOY_USER="${DEPLOY_USER:-root}"
APP_DIR=""

# Find the app directory
for dir in "/home/$DEPLOY_USER/quatava" "/home/deploy/quatava" "/root/quatava" "/home/$DEPLOY_USER/quatava4" "/var/www/quatava"; do
    if [ -d "$dir/frontend" ]; then
        APP_DIR="$dir"
        break
    fi
done

if [ -z "$APP_DIR" ]; then
    err "Could not find Quatava app directory. Checking common locations..."
    find /home -maxdepth 3 -name "production.config.js" 2>/dev/null
    find /root -maxdepth 3 -name "production.config.js" 2>/dev/null
    find /var/www -maxdepth 3 -name "production.config.js" 2>/dev/null
    echo ""
    err "Set APP_DIR manually: APP_DIR=/path/to/quatava sudo ./hostinger-fix.sh"
    exit 1
fi

log "Found app at: $APP_DIR"

# ============================================
# STEP 1: Diagnose current state
# ============================================
log "Step 1/6: Diagnosing current state..."

echo ""
echo "--- PM2 Status ---"
pm2 list 2>/dev/null || warn "PM2 not running or not installed"

echo ""
echo "--- Nginx Status ---"
systemctl status nginx --no-pager -l 2>/dev/null | head -10 || warn "Nginx not running"

echo ""
echo "--- Port Check ---"
if command -v ss &>/dev/null; then
    ss -tlnp | grep -E ':(3000|4000|80|443)\s' || warn "Expected ports not listening"
elif command -v netstat &>/dev/null; then
    netstat -tlnp | grep -E ':(3000|4000|80|443)\s' || warn "Expected ports not listening"
fi

echo ""
echo "--- Testing localhost ---"
curl -sI http://127.0.0.1:3000/en 2>/dev/null | head -3 || warn "Frontend not responding on port 3000"
curl -sI http://127.0.0.1:4000/api/settings 2>/dev/null | head -3 || warn "Backend not responding on port 4000"

# ============================================
# STEP 2: Update .env for domain
# ============================================
log "Step 2/6: Updating .env for domain..."

if [ -f "$APP_DIR/.env" ]; then
    # Update SITE_URL to use domain
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"https://$DOMAIN\"|" "$APP_DIR/.env"
    log "Updated NEXT_PUBLIC_SITE_URL to https://$DOMAIN"

    # Ensure NEXT_PUBLIC_LANGUAGES is set
    if ! grep -q "NEXT_PUBLIC_LANGUAGES" "$APP_DIR/.env"; then
        echo 'NEXT_PUBLIC_LANGUAGES="en"' >> "$APP_DIR/.env"
        log "Added NEXT_PUBLIC_LANGUAGES=en"
    fi
else
    warn ".env file not found at $APP_DIR/.env"
fi

# ============================================
# STEP 3: Install Nginx if missing
# ============================================
log "Step 3/6: Ensuring Nginx is installed..."

if ! command -v nginx &>/dev/null; then
    apt update && apt install -y nginx
    log "Nginx installed"
else
    log "Nginx already installed"
fi

# ============================================
# STEP 4: Configure Nginx with domain
# ============================================
log "Step 4/6: Configuring Nginx for $DOMAIN..."

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
    listen 80;
    listen [::]:80;
    server_name getquatava.com www.getquatava.com;

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

if nginx -t 2>&1; then
    systemctl reload nginx
    log "Nginx configured and reloaded"
else
    err "Nginx config test failed!"
    nginx -t
fi

# ============================================
# STEP 5: Start/restart app with PM2
# ============================================
log "Step 5/6: Starting application..."

cd "$APP_DIR"

# Check if backend is built
if [ ! -f "$APP_DIR/backend/dist/index.js" ]; then
    warn "Backend not built. Building now..."
    cd "$APP_DIR"

    # Install deps if needed
    if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ]; then
        log "Installing dependencies..."
        if command -v pnpm &>/dev/null; then
            NODE_OPTIONS='--max-old-space-size=4096' pnpm install --no-frozen-lockfile
        else
            npm install --legacy-peer-deps
            cd frontend && npm install --legacy-peer-deps && cd ..
        fi
    fi

    # Build
    if command -v pnpm &>/dev/null; then
        NODE_OPTIONS='--max-old-space-size=4096' pnpm build:all
    else
        cd backend && npx tsc && cd ..
        cd frontend && NODE_OPTIONS='--max-old-space-size=4096' npx next build && cd ..
    fi
fi

# Start with PM2
pm2 delete all 2>/dev/null || true
pm2 start production.config.js --env production
pm2 save

log "Application started with PM2"
pm2 list

# ============================================
# STEP 6: SSL with Let's Encrypt
# ============================================
log "Step 6/6: Setting up SSL..."

if ! command -v certbot &>/dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

echo ""
log "To enable HTTPS, run:"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
log "Or run it automatically now? (y/n)"
read -r REPLY
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    log "SSL configured!"
else
    log "Skipping SSL. Run the certbot command above when ready."
fi

# ============================================
# Final verification
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}VERIFICATION${NC}"
echo "============================================"
echo ""

sleep 3

echo "Frontend (port 3000):"
curl -sI http://127.0.0.1:3000/en 2>/dev/null | head -3 || echo "  NOT RESPONDING"

echo ""
echo "Backend (port 4000):"
curl -sI http://127.0.0.1:4000/api/settings 2>/dev/null | head -3 || echo "  NOT RESPONDING"

echo ""
echo "Nginx (port 80):"
curl -sI http://127.0.0.1:80 -H "Host: $DOMAIN" 2>/dev/null | head -3 || echo "  NOT RESPONDING"

echo ""
echo "============================================"
echo -e "${GREEN}DONE!${NC}"
echo "============================================"
echo ""
echo "If frontend/backend show NOT RESPONDING:"
echo "  1. Check PM2 logs: pm2 logs"
echo "  2. Check if build exists: ls frontend/.next/"
echo "  3. Rebuild: cd $APP_DIR && pnpm build:all"
echo "  4. Restart: pm2 restart all"
echo ""
echo "If Nginx shows NOT RESPONDING:"
echo "  1. Check status: systemctl status nginx"
echo "  2. Check config: nginx -t"
echo "  3. Check logs: tail -20 /var/log/nginx/error.log"
echo ""
echo "Visit: http://$DOMAIN (or https:// after SSL setup)"
echo "============================================"
