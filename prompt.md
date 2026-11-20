# Prompt Setup Otomatis untuk AI Agent di VPS (IP: 202.10.42.14)

Salin seluruh teks di bawah ini dan berikan langsung kepada AI Agent (seperti Claude Code, Cursor, Antigravity, Aider, atau CLI Agent lainnya) yang berjalan di server VPS baru Anda (`root@202.10.42.14`):

---

```markdown
Tolong konfigurasikan dan deploy proyek Dashboard-Monitoring-Udara ini secara menyeluruh ke mode production di server VPS saya (IP Publik: 202.10.42.14) lengkap dengan SSL (HTTPS). 
Server ini masih kosongan (fresh install Ubuntu/Debian) dan akses dilakukan langsung melalui Public IP menggunakan Self-Signed SSL Certificate.

Lakukan langkah-langkah instalasi dan konfigurasi berikut secara berurutan dan mandiri:

1. Perbarui sistem operasi dan instal paket dasar yang dibutuhkan:
   sudo apt-get update -y
   sudo apt-get install -y curl git build-essential python3 make g++ nginx openssl ufw

2. Periksa versi Node.js. Jika belum ada atau di bawah v20, instal Node.js v22 LTS dari NodeSource dan PM2 secara global:
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2

3. Buat direktori sertifikat SSL dan buat Self-Signed SSL Certificate khusus untuk IP Publik 202.10.42.14 (berlaku 365 hari):
   sudo mkdir -p /etc/ssl/private /etc/ssl/certs
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt \
     -subj "/C=ID/ST=Indonesia/L=Jakarta/O=Archtera/OU=AirSafeArea/CN=202.10.42.14"

4. Konfigurasi Backend Node.js Express (folder 'backend'):
   - Masuk ke folder backend: cd backend
   - Jalankan 'npm install'
   - Inisialisasi basis data SQLite dan data awal: 'node seed_data.js'
   - Daftarkan dan jalankan backend dengan PM2: pm2 start bridge.js --name "air-backend"
   - Simpan status PM2 dan aktifkan startup otomatis saat VPS reboot:
     pm2 save && sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME

5. Konfigurasi Frontend React (folder 'frontend'):
   - Masuk ke folder frontend: cd ../frontend
   - Jalankan 'npm install'
   - Lakukan build produksi: 'npm run build' (menghasilkan folder 'dist')

6. Konfigurasi Web Server Nginx dengan SSL Reverse Proxy:
   - Buat file konfigurasi /etc/nginx/sites-available/air-dashboard
   - Blok HTTP (Port 80): listen 80; return 301 https://$host$request_uri;
   - Blok HTTPS (Port 443): listen 443 ssl http2;
     - Gunakan ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt; dan ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
     - Root static files diarahkan ke absolut path 'frontend/dist' proyek ini dengan 'try_files $uri $uri/ /index.html;'
     - Reverse proxy 'location /api/' diarahkan ke 'http://127.0.0.1:3000/' lengkap dengan header proxy Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto https.
     - Aktifkan gzip compression untuk file teks, css, dan js.
   - Hapus /etc/nginx/sites-enabled/default jika ada, lalu buat symlink ke /etc/nginx/sites-enabled/air-dashboard
   - Validasi konfigurasi dengan 'sudo nginx -t' dan restart Nginx: 'sudo systemctl restart nginx' && 'sudo systemctl enable nginx'

7. Buka port firewall jika UFW aktif:
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp

8. Verifikasi Kesiapan Layanan:
   - Periksa PM2 backend: pm2 status (pastikan 'air-backend' status online)
   - Uji endpoint backend: curl -k https://127.0.0.1/api/status
   - Pastikan Nginx aktif: sudo systemctl status nginx --no-pager

9. Berikan saya ringkasan alamat HTTPS (https://202.10.42.14/) dan status seluruh service yang berjalan.
```

---

### Alternatif 1-Perintah via Skrip Otomasi

Jika repositori sudah di-clone di VPS, AI Agent juga dapat langsung mengeksekusi skrip otomasi yang tersedia:

```bash
cd /root/Dashboard-Monitoring-Udara
git pull origin main
chmod +x setup-production.sh
sudo ./setup-production.sh
```

---

### Daftar URL Akses Sistem Setelah Deploy

* **Frontend Dashboard (HTTPS)**: `https://202.10.42.14/`
* **Dashboard Telemetri**: `https://202.10.42.14/dashboard`
* **Dokumentasi Backend API**: `https://202.10.42.14/docs-backend`
* **Dokumentasi IoT**: `https://202.10.42.14/docs-iot`
* **Dokumentasi VPS**: `https://202.10.42.14/docs-vps`
* **Endpoint Status API**: `https://202.10.42.14/api/status`
