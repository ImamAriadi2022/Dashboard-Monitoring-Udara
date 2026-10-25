# Panduan Deploy Production VPS dengan SSL (HTTPS) — Dashboard Monitoring Udara

Dokumentasi ini dibuat khusus agar **AI Agent** atau developer dapat mengonfigurasi dan menjalankan proyek ini secara otomatis dari kondisi VPS yang masih kosong (*fresh install* Ubuntu/Debian), lengkap dengan **enkripsi SSL (HTTPS)** meskipun **belum memiliki domain** (menggunakan Public IP).

---

## 🔒 Arsitektur SSL Tanpa Domain

Karena VPS belum memiliki domain, sistem menggunakan **Self-Signed SSL Certificate** (atau Dynamic DNS sslip.io):
1. **Frontend & Backend satu pintu di Port 443 (HTTPS)**:
   * Frontend: Diakses melalui `https://<IP_VPS>/`
   * Backend API: Diakses secara aman melalui reverse proxy `https://<IP_VPS>/api/`
2. **Bebas Masalah *Mixed-Content***:
   * Karena frontend dan backend sama-sama berada di protokol `https://`, browser tidak akan memblokir request API atau unduhan data CSV.
3. **Redirect Otomatis**:
   * Akses biasa `http://<IP_VPS>` otomatis dialihkan (*301 Redirect*) ke `https://<IP_VPS>`.

---

## ⚡ Cara Cepat Sekali Klik (Automated Script)

Cukup clone repository lalu jalankan script:

```bash
git clone <URL_REPOSITORY_ANDA>
cd Dashboard-Monitoring-Udara
chmod +x setup-production.sh
./setup-production.sh
```

---

## 🤖 Prompt untuk AI Agent di Production VPS

Salin dan berikan prompt di bawah ini kepada AI Agent yang berjalan di VPS Anda:

```markdown
Tolong konfigurasikan dan deploy proyek Dashboard-Monitoring-Udara ini ke mode production di VPS saya lengkap dengan SSL (HTTPS). VPS ini masih kosongan (fresh install Ubuntu/Debian) dan saya belum memiliki nama domain (menggunakan Public IP).

Lakukan langkah-langkah berikut secara berurutan dan mandiri:
1. Perbarui sistem dan instal paket dasar yang dibutuhkan:
   sudo apt-get update -y
   sudo apt-get install -y curl git build-essential python3 make g++ nginx openssl ufw

2. Periksa versi Node.js. Jika belum ada atau di bawah v20, instal Node.js v22 LTS dari NodeSource:
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs

3. Instal PM2 untuk process manager:
   sudo npm install -g pm2

4. Dapatkan IP publik VPS dan buat Self-Signed SSL Certificate:
   PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
   sudo mkdir -p /etc/ssl/private /etc/ssl/certs
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt \
     -subj "/C=ID/ST=Indonesia/L=Jakarta/O=AirSafe/OU=IoT/CN=$PUBLIC_IP"

5. Konfigurasi Backend:
   - Masuk ke folder 'backend': cd backend
   - Jalankan 'npm install'
   - Jalankan 'node seed_data.js' untuk menginisialisasi database SQLite dan data riwayat
   - Daftarkan dan jalankan backend dengan PM2: pm2 start bridge.js --name "air-backend"
   - Simpan status PM2 dan aktifkan startup otomatis saat VPS reboot:
     pm2 save && sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME

6. Konfigurasi Frontend:
   - Masuk ke folder 'frontend': cd ../frontend
   - Jalankan 'npm install'
   - Jalankan 'npm run build' untuk menghasilkan file produksi di folder 'dist'

7. Konfigurasi Nginx dengan SSL (Port 80 -> 443 Redirect & Reverse Proxy /api/):
   - Buat file konfigurasi /etc/nginx/sites-available/air-dashboard
   - Blok 1: listen 80; return 301 https://$host$request_uri;
   - Blok 2: listen 443 ssl http2;
     - Gunakan ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt; dan key /etc/ssl/private/nginx-selfsigned.key;
     - Root diarahkan ke path 'frontend/dist' proyek ini dengan 'try_files $uri $uri/ /index.html;'
     - Reverse proxy 'location /api/' diarahkan ke 'http://127.0.0.1:3000/' lengkap dengan proxy header Host, X-Real-IP, X-Forwarded-Proto https.
   - Hapus /etc/nginx/sites-enabled/default jika ada, lalu tautkan /etc/nginx/sites-available/air-dashboard ke /etc/nginx/sites-enabled/
   - Uji dengan 'sudo nginx -t' dan restart Nginx: 'sudo systemctl restart nginx'

8. Buka port firewall 80, 443, dan 22 jika UFW aktif.

9. Berikan saya ringkasan alamat HTTPS dan rute aplikasi yang berjalan:
   - Web Landing Page: https://202.155.17.57/
   - Dashboard Telemetri: https://202.155.17.57/dashboard
   - Dokumentasi Backend: https://202.155.17.57/docs-backend
   - Dokumentasi IoT: https://202.155.17.57/docs-iot
   - Backend API Status: https://202.155.17.57/api/status
```

---

## 📌 Daftar Rute Aplikasi (Base IP: 202.155.17.57)

| Rute URL | Protokol | Keterangan |
| :--- | :--- | :--- |
| `https://202.155.17.57/` | HTTPS (SSL) | Halaman Depan / Landing Page AirSafe |
| `https://202.155.17.57/dashboard` | HTTPS (SSL) | Dashboard Monitoring Sensor & Grafik 4 Ruangan |
| `https://202.155.17.57/docs-backend` | HTTPS (SSL) | **Dokumentasi Lengkap Backend & RESTful API** |
| `https://202.155.17.57/docs-iot` | HTTPS (SSL) | **Dokumentasi & Firmware IoT (ESP32/Arduino)** |
| `https://202.155.17.57/api/*` | HTTPS (SSL) | Reverse Proxy Nginx ke Express Server |

---

## 💡 Akses Pertama Kali di Browser
Saat pertama kali membuka `https://202.155.17.57/`, peramban (Chrome/Edge/Firefox) akan menampilkan pemberitahuan keamanan standar karena menggunakan sertifikat *Self-Signed* (tanpa domain). Cukup:
1. Klik tombol **"Lanjutan"** (*Advanced*).
2. Klik link **"Lanjutkan ke 202.155.17.57 (tidak aman)"**.
3. Website dan API akan langsung berjalan dengan enkripsi SSL HTTPS penuh.
