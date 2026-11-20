# Panduan Setup Otomatis untuk AI Agent di VPS (IP: 202.10.42.14)

Dokumen ini dirancang khusus sebagai panduan operasional teknis untuk **AI Coding Agent** (seperti *Claude Code, Antigravity, Aider, Cursor, Copilot CLI, atau LLM Agent lainnya*) yang sedang berjalan di dalam server VPS baru (**IP: 202.10.42.14**).

Panduan ini berisi instruksi terstruktur, spesifikasi arsitektur, skrip 1-klik, dan langkah demi langkah eksekusi agar agen dapat langsung mengonfigurasi seluruh sistem **Archtera — Air Safe Area** dari kondisi server kosong (*fresh install Ubuntu/Debian*) hingga siap diakses via HTTPS secara mandiri.

---

## 🎯 Ringkasan Spesifikasi Target Server

* **IP Publik VPS**: `202.10.42.14`
* **Sistem Operasi**: Ubuntu 22.04 / 24.04 LTS atau Debian 12 (64-bit)
* **Pengguna Default**: `root`
* **Protokol Akses Web**: HTTPS (`https://202.10.42.14/`) dengan *Self-Signed SSL*
* **Web Server & Reverse Proxy**: Nginx (Port 80 HTTP -> 443 HTTPS)
* **Backend Runtime**: Node.js v22 LTS + Express (`bridge.js`) via PM2 (Port internal `3000`)
* **Basis Data**: SQLite (`better-sqlite3`, berkas `backend/air_data.db`)
* **Frontend**: React + Vite SPA (Hasil build di `frontend/dist/`)
* **Broker MQTT**: `broker.emqx.io` (Public Broker, Topik: `monitoring_udara_ta/data`)

---

## 📋 Prompt 1-Klik Siap Pakai untuk AI Agent di VPS

Jika Anda menjalankan AI Agent di terminal VPS (misalnya via `claude`, `antigravity`, `aider`, dll.), Anda cukup menyalin seluruh blok teks di bawah ini dan memberikannya sebagai instruksi awal (*prompt*):

```markdown
Tolong setup dan deploy project Dashboard-Monitoring-Udara ini secara menyeluruh di VPS saya (IP Publik: 202.10.42.14). 
Server ini masih kosongan (fresh install Ubuntu) dan saat ini akses dilakukan langsung melalui Public IP dengan SSL HTTPS (Self-Signed Certificate).

Lakukan langkah-langkah instalasi dan konfigurasi berikut secara berurutan:

1. Perbarui repositori paket apt dan instal dependensi sistem operasi:
   sudo apt-get update -y && sudo apt-get install -y curl git build-essential python3 make g++ ufw nginx openssl

2. Pastikan Node.js v22 LTS terinstal (dari NodeSource jika belum ada) dan instal PM2 secara global:
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2

3. Buat sertifikat SSL Self-Signed untuk IP 202.10.42.14:
   sudo mkdir -p /etc/ssl/private /etc/ssl/certs
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt \
     -subj "/C=ID/ST=Indonesia/L=Jakarta/O=Archtera/OU=AirSafeArea/CN=202.10.42.14"

4. Setup Backend (folder 'backend'):
   - Jalankan 'npm install'
   - Inisialisasi basis data dengan 'node seed_data.js'
   - Jalankan backend dengan PM2: 'pm2 start bridge.js --name "air-backend"'
   - Simpan konfigurasi PM2: 'pm2 save' dan aktifkan startup otomatis: 'sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME'

5. Setup Frontend (folder 'frontend'):
   - Jalankan 'npm install'
   - Jalankan 'npm run build' untuk menghasilkan direktori static 'dist/'

6. Konfigurasikan Web Server Nginx di '/etc/nginx/sites-available/air-dashboard':
   - Listen port 80 dengan redirect 301 ke https://$host$request_uri;
   - Listen port 443 ssl http2 dengan ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt dan key /etc/ssl/private/nginx-selfsigned.key;
   - Root direktori diarahkan ke 'frontend/dist' dengan 'try_files $uri $uri/ /index.html;';
   - Reverse proxy location '/api/' diarahkan ke 'http://127.0.0.1:3000/';
   - Aktifkan site dengan symlink ke '/etc/nginx/sites-enabled/air-dashboard' dan hapus file 'default';
   - Uji dengan 'nginx -t' lalu restart service 'sudo systemctl restart nginx'.

7. Konfigurasi Firewall UFW:
   - Pastikan port 22 (SSH), 80 (HTTP), dan 443 (HTTPS) terbuka.

8. Verifikasi Kesiapan Layanan:
   - Jalankan 'curl -k https://127.0.0.1/api/status' untuk memastikan API merespons { status: "online" }
   - Periksa 'pm2 status' untuk memastikan proses 'air-backend' berstatus 'online'
   - Berikan ringkasan URL akses HTTPS kepada saya.
```

---

## ⚡ Metode Alternatif: Eksekusi 1-Klik via Skrip Otomasi

Repositori ini telah dilengkapi dengan skrip instalasi otomatis `setup-production.sh` yang mendeteksi IP publik secara dinamis, mengunduh dependensi, menyusun sertifikat SSL, melakukan *build*, dan mengonfigurasi Nginx.

AI Agent di VPS cukup mengeksekusi dua perintah berikut dari *root directory* repositori:

```bash
chmod +x setup-production.sh
sudo ./setup-production.sh
```

---

## 🛠️ Rincian Prosedur Manual / Perintah Shell Langkah Demi Langkah

Jika AI Agent memilih mengeksekusi perintah shell secara bertahap atau perlu melakukan *debugging*, ikuti prosedur standar berikut:

### Langkah 1: Persiapan Sistem Operasi
```bash
sudo apt-get update -y
sudo apt-get install -y curl git build-essential python3 make g++ ufw nginx openssl
```

### Langkah 2: Instalasi Node.js (v22 LTS) & PM2
```bash
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

### Langkah 3: Pembuatan Sertifikat SSL Self-Signed (HTTPS)
```bash
sudo mkdir -p /etc/ssl/private /etc/ssl/certs
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/C=ID/ST=Indonesia/L=Jakarta/O=Archtera/OU=AirSafeArea/CN=202.10.42.14"
```

### Langkah 4: Setup Backend Express
```bash
REPO_DIR=$(pwd)
cd "$REPO_DIR/backend"
npm install
node seed_data.js

# Jalankan service background dengan PM2
pm2 delete air-backend 2>/dev/null || true
pm2 start bridge.js --name "air-backend"
pm2 save

# Setup PM2 auto-start saat reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || true
```

### Langkah 5: Setup & Build Frontend React Vite
```bash
cd "$REPO_DIR/frontend"
npm install
npm run build
```

### Langkah 6: Konfigurasi Nginx Web Server
Buat berkas konfigurasi Nginx di `/etc/nginx/sites-available/air-dashboard`:

```bash
sudo tee /etc/nginx/sites-available/air-dashboard > /dev/null <<EOF
# Redirect HTTP (Port 80) ke HTTPS (Port 443)
server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

# HTTPS Server (Port 443)
server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root $REPO_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
```

Aktifkan konfigurasi dan muat ulang Nginx:
```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/air-dashboard /etc/nginx/sites-enabled/air-dashboard
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Langkah 7: Pengaturan Firewall (UFW)
```bash
if sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
fi
```

### Langkah 8: Verifikasi & Smoke Testing
```bash
# 1. Periksa status PM2 backend
pm2 status

# 2. Uji endpoint API lokal
curl -k https://127.0.0.1/api/status

# 3. Uji endpoint latest telemetri
curl -k https://127.0.0.1/api/latest?room=h5

# 4. Periksa log backend jika ada kendala
pm2 logs air-backend --lines 20
```

---

## 🌐 Daftar URL Akses Setelah Deployment

Setelah proses selesai, seluruh fitur dapat diakses melalui browser:

* **Landing Page**: `https://202.10.42.14/`
* **Dashboard Monitoring 4 Ruangan**: `https://202.10.42.14/dashboard`
* **Dokumentasi Terpadu**: `https://202.10.42.14/docs-all`
* **Dokumentasi REST API Backend**: `https://202.10.42.14/docs-backend`
* **Dokumentasi Firmware IoT**: `https://202.10.42.14/docs-iot`
* **Dokumentasi VPS**: `https://202.10.42.14/docs-vps`
* **Panel Manajemen Data (Admin)**: `https://202.10.42.14/admin`
* **Status Health Check API**: `https://202.10.42.14/api/status`

> **Catatan Akses Browser Pertama Kali**:
> Karena menggunakan sertifikat *Self-Signed* (akses langsung via IP tanpa domain terdaftar), peramban (Chrome/Edge/Firefox) akan menampilkan peringatan keamanan *"Your connection is not private"*. Klik tombol **Advanced / Lanjutan** lalu pilih **Proceed to 202.10.42.14 (unsafe) / Lanjutkan ke 202.10.42.14 (tidak aman)**. Semua koneksi data tetap terenkripsi penuh melalui protokol HTTPS/TLS.
