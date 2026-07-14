# Quatava — VPS Deployment Guide

Target: a generic Ubuntu **22.04 LTS** or **24.04 LTS** VPS on DigitalOcean / Linode / Vultr / Hetzner.
No domain (yet) — frontend bound directly to the VPS IP. Add a domain + Let's Encrypt later (see "Adding a domain" at the bottom).

This guide assumes you can SSH in as a sudo-capable user. Replace `YOUR_VPS_IP` with your actual IP throughout.

---

## 0. Sizing

| Component | Minimum | Recommended |
|---|---|---|
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| Bandwidth | 1 TB/mo | 2 TB/mo |

> **Memory note**: the Next.js production build peaks at ~4.8 GB RSS. If your VPS has < 6 GB RAM, you should add swap (covered below) or build locally and rsync the `frontend/.next` and `backend/dist` directories to the VPS instead of building on the box.

---

## 1. Initial server hardening

SSH in as root (or your provider's default sudo user), then:

```bash
# 1a. Update everything
apt update && apt upgrade -y

# 1b. Create a deploy user (replace 'deploy' with whatever name you prefer)
adduser deploy
usermod -aG sudo deploy

# 1c. Copy your SSH key to the new user (from your laptop):
#     ssh-copy-id deploy@YOUR_VPS_IP

# 1d. Disable password auth and root SSH
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh

# 1e. Firewall (UFW)
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH       # port 22
ufw allow 80/tcp        # Nginx public
# We deliberately DO NOT open 3000 or 4000 — Nginx will reverse-proxy them.
ufw --force enable
ufw status

# 1f. fail2ban (basic SSH brute-force protection)
apt install -y fail2ban
systemctl enable --now fail2ban
```

**Log out and re-log in as `deploy`** for the rest of this guide.

---

## 2. Add swap if RAM < 6 GB

Skip this step if your VPS has 8+ GB RAM.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## 3. Install Node.js 22 + pnpm

```bash
# 3a. Install nvm (no sudo)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

# 3b. Install Node 22 LTS
nvm install 22 --lts
nvm alias default 22

# 3c. Install pnpm v10 (matches our lockfile authoring version)
corepack enable
corepack prepare pnpm@10.15.0 --activate

# Sanity
node --version    # v22.x.x
pnpm --version    # 10.15.0
```

---

## 4. Install build toolchain + Python + PM2

```bash
sudo apt install -y \
  build-essential g++ python3 python-is-python3 \
  libtool-bin autoconf automake \
  git curl wget unzip jq

# PM2 for process management
npm install -g pm2
```

---

## 5. Install MariaDB 10.11

```bash
sudo apt install -y mariadb-server mariadb-client
sudo systemctl enable --now mariadb

# Set root password and lock down install
sudo mariadb-secure-installation
# Answer:
#   - new root password: (set a strong one)
#   - remove anonymous users: Y
#   - disallow root login remotely: Y
#   - remove test database: Y
#   - reload privilege tables: Y

# Create the app database + user
sudo mariadb -u root -p <<'EOF'
CREATE DATABASE IF NOT EXISTS quatava CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quatava_admin'@'localhost' IDENTIFIED BY 'CHANGEME_strong_password';
GRANT ALL PRIVILEGES ON quatava.* TO 'quatava_admin'@'localhost';
FLUSH PRIVILEGES;
EOF
```

> **Replace `CHANGEME_strong_password` with a real strong password** — at least 24 chars, mixed case, digits, no `!`/`$`/`` ` `` (those cause shell quoting headaches in .env). Generate with `openssl rand -base64 24`.

---

## 6. Install Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
redis-cli ping   # expect: PONG
```

---

## 7. Get the Quatava source onto the VPS

Pick **one** of these three approaches:

### Option A — git clone (if you've pushed to a git remote)

```bash
cd ~
git clone YOUR_GIT_REMOTE quatava
cd quatava
```

### Option B — rsync from your dev machine (zero git required)

From your WSL workstation:

```bash
# Excludes the local build outputs and dev artifacts; we'll rebuild on the server.
rsync -avz --progress \
  --exclude node_modules --exclude .next --exclude dist \
  --exclude '*.log' --exclude '.quatava-secrets' \
  ~/quatava-main/ deploy@YOUR_VPS_IP:~/quatava/
```

### Option C — upload built artifacts (faster if VPS has < 6 GB RAM)

If you've already built on your dev machine and don't want to build on the server:

```bash
# First do a normal rsync of source EXCEPT node_modules
rsync -avz --exclude node_modules --exclude '*.log' \
  ~/quatava-main/ deploy@YOUR_VPS_IP:~/quatava/

# Then rsync the build outputs separately
rsync -avz ~/quatava-main/frontend/.next/ deploy@YOUR_VPS_IP:~/quatava/frontend/.next/
rsync -avz ~/quatava-main/backend/dist/   deploy@YOUR_VPS_IP:~/quatava/backend/dist/
```

---

## 8. Configure `.env` on the VPS

```bash
cd ~/quatava
cp .env.example .env
nano .env   # or vim
```

Key values to set (these differ from local dev):

```bash
# Site
NEXT_PUBLIC_SITE_URL="http://YOUR_VPS_IP"        # NO trailing :3000 — Nginx proxies port 80
NEXT_PUBLIC_SITE_NAME="Quatava"
NODE_ENV="production"
NEXT_PUBLIC_FRONTEND_PORT="3000"                 # Internal; Nginx talks to this
NEXT_PUBLIC_BACKEND_PORT="4000"                  # Internal; Nginx talks to this
NEXT_PUBLIC_LANGUAGES="en"

# Database (use the password from Step 5)
DB_NAME="quatava"
DB_USER="quatava_admin"
DB_PASSWORD="THE_PASSWORD_FROM_STEP_5"
DB_HOST="127.0.0.1"
DB_PORT="3306"

# JWT secrets — REGENERATE these for production. Do NOT reuse dev secrets.
#   Run on the VPS to generate fresh ones:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
APP_ACCESS_TOKEN_SECRET="..."
APP_REFRESH_TOKEN_SECRET="..."
APP_RESET_TOKEN_SECRET="..."
APP_VERIFY_TOKEN_SECRET="..."
JWT_EXPIRY="30m"
JWT_REFRESH_EXPIRY="30d"

# License
APP_LICENSE_API_URL="https://api.mashdiv.com"
API_LICENSE_API_KEY="CF30BB9297634F7075F6"

# Encryption (regenerate)
ENCRYPTION_KEY_PASSPHRASE="..."

# Mailer + 2FA + reCAPTCHA + Google OAuth + Stripe + Binance: all OFF for MVP
# (Match the booleans we set locally — see local .env for the full list.)

# CLIENT PLATFORM — for production prefer "browser" (not "browser-dev")
APP_CLIENT_PLATFORM="browser"
```

Lock down the file:

```bash
chmod 600 .env
```

---

## 9. Install dependencies + build on the VPS

(Skip the build step if you used **Option C** in step 7.)

```bash
cd ~/quatava

# Network-tuned pnpm config — same as we used locally
cat > .npmrc <<'EOF'
network-timeout=600000
fetch-retries=10
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
prefer-offline=true
auto-install-peers=true
EOF

# Install (allow build scripts for our pinned native modules)
CI=1 pnpm install --reporter=append-only

# Some native modules need their build scripts approved.
# Our package.json already lists them in pnpm.onlyBuiltDependencies.
PYTHON=python3 pnpm rebuild

# Build both backend (tsc) and frontend (next build)
NODE_OPTIONS='--max-old-space-size=4096' pnpm build:all
```

---

## 10. Seed the database

```bash
cd ~/quatava
pnpm seed
```

Then **rotate the super-admin password** (do NOT keep the default `12345678`):

```bash
cd ~/quatava/backend
node -e "
const crypto = require('crypto');
const argon2 = require('argon2');
(async () => {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_';
  let pw = '';
  for (let i = 0; i < 20; i++) pw += alpha[crypto.randomBytes(1)[0] % alpha.length];
  const hash = await argon2.hash(pw);
  console.log('NEW PASSWORD:', pw);
  console.log('Run this SQL as your DB user:');
  console.log(\`UPDATE user u JOIN role r ON r.id=u.roleId SET u.password='\${hash}' WHERE r.name='Super Admin';\`);
})();
"
```

Take the printed UPDATE statement and run it via `mariadb -u quatava_admin -p quatava`. **Save the printed password in your password manager** — it's not stored anywhere on the server.

---

## 11. Start with PM2

The project ships `production.config.js` at the repo root. It starts both backend and frontend.

```bash
cd ~/quatava
pm2 start production.config.js --env production
pm2 status
pm2 logs --lines 30   # check for errors; Ctrl-C to exit logs
```

Make PM2 boot on reboot:

```bash
pm2 startup systemd
# It prints a command — copy and run that as sudo:
#   e.g.: sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v22.x.x/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
pm2 save
```

Sanity:

```bash
curl -sS http://127.0.0.1:4000/api/settings | head -c 200
curl -sSI http://127.0.0.1:3000/en | head -3
```

---

## 12. Nginx reverse proxy

```bash
sudo apt install -y nginx
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null
```

Create `/etc/nginx/sites-available/quatava`:

```nginx
# /etc/nginx/sites-available/quatava
#
# IP-only deployment (no domain). All HTTP traffic on port 80
# is proxied to the local Next.js (port 3000) + backend API (port 4000).

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

    # Generous body size for asset uploads / KYC docs.
    client_max_body_size 25M;

    # gzip & basic perf
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Security headers (basic; we'll harden in Task 9)
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    # Backend API and websockets (uWebSockets)
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

    # Next.js static assets — long cache, served by Next
    location /_next/static/ {
        proxy_pass http://quatava_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else → Next.js
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
```

Enable + test + reload:

```bash
sudo ln -s /etc/nginx/sites-available/quatava /etc/nginx/sites-enabled/quatava
sudo nginx -t
sudo systemctl reload nginx
```

Now visit `http://YOUR_VPS_IP` in your browser. You should see the Quatava home page.

---

## 13. First post-deploy checks

```bash
# Backend health
curl -sS http://YOUR_VPS_IP/api/settings

# Frontend reachable
curl -sSI http://YOUR_VPS_IP/en | head -3

# PM2 process list
pm2 status

# Nginx access log (tail in one terminal while you browse)
sudo tail -f /var/log/nginx/access.log
```

Then log in via the browser:

- URL: `http://YOUR_VPS_IP/en/login`
- Email: `superadmin@example.com`
- Password: (the one you generated in step 10)

---

## 14. Adding a domain later

When you're ready to swap from IP-only to a real domain (e.g. `quatava.example.com`):

```bash
# 1. Point an A record at YOUR_VPS_IP via your DNS provider.

# 2. Update the Nginx config — change `server_name _;` to:
#    server_name quatava.example.com;

# 3. Install certbot and grab a Let's Encrypt cert.
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d quatava.example.com --redirect --agree-tos -m you@example.com

# 4. Update .env:
#    NEXT_PUBLIC_SITE_URL="https://quatava.example.com"
#    Then: pm2 restart all

# Certbot auto-renews via a systemd timer — verify with:
sudo systemctl list-timers | grep certbot
```

---

## 15. Operations cheat sheet

```bash
# Status
pm2 status
pm2 logs backend  --lines 50
pm2 logs frontend --lines 50

# Restart after .env change
pm2 restart all

# Stop everything
pm2 stop all

# Update from git
cd ~/quatava
git pull
pnpm install
NODE_OPTIONS='--max-old-space-size=4096' pnpm build:all
pm2 restart all

# Database backup (daily cron suggested)
mysqldump -u quatava_admin -p quatava | gzip > ~/backups/quatava-$(date +%F).sql.gz

# Restart Nginx after config change
sudo nginx -t && sudo systemctl reload nginx
```

---

## 16. Things still on the punch list (Task 9 — Hardening)

- **HTTPS / a real domain** — strongly recommended before going live with real users.
- **Real SMTP** — turn `NEXT_PUBLIC_VERIFY_EMAIL_STATUS` back on after wiring SendGrid / Mailgun.
- **Stripe + Binance keys** — wire up real keys once you're past internal testing.
- **Backups** — automate the `mysqldump` cron above plus snapshot the VPS at your provider.
- **Monitoring** — at minimum, Uptime Robot pinging `/api/settings`. Better: PM2 Plus or a Grafana dashboard.
- **Rate limiting** — `.env` already sets `RATE_LIMIT=100` / 60s but verify it's enforced.
- **Log rotation** — `/var/log/nginx` rotates by default; PM2 logs need `pm2 install pm2-logrotate`.
- **Disk alerts** — set a provider-side alert for >80% disk usage.
- **Disable build-error suppression** — currently `frontend/next.config.js` has `typescript.ignoreBuildErrors: true`. For long-term health, run `tsc --noEmit` in CI to catch real type errors.
