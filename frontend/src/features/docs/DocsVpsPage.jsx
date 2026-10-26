import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Cpu,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  FileCode,
  BookOpen,
} from 'lucide-react';
import CodeBlock from './components/CodeBlock';

export default function DocsVpsPage({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const vpsInfo = {
    ip: '202.155.17.57',
    username: 'root',
    password: 'iot123bridge321',
    port: '22',
    os: 'Ubuntu 22.04 / 24.04 LTS (atau Debian 12)',
    sshCommand: 'ssh root@202.155.17.57',
  };

  const handleCopy = (field, text) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200/80 bg-white shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('landing')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Beranda</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Akses Server
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight flex items-center gap-3">
                <Server className="h-7 w-7 text-amber-600" />
                <span>Dokumentasi & Kredensial Server VPS</span>
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Informasi login SSH, konfigurasi arsitektur produksi, otomatisasi deploy di VPS <strong>{vpsInfo.ip}</strong>, dan pemeliharaan service sistem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('docs-all')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Hub Pengantar</span>
              </button>

              <button
                onClick={() => onNavigate('docs-backend')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Docs API Backend</span>
              </button>

              <button
                onClick={() => onNavigate('docs-iot')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-cyan-700 transition-all cursor-pointer shadow-2xs"
              >
                <Cpu className="h-4 w-4 text-cyan-600" />
                <span>Docs IoT</span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
        {/* Section 1: Kredensial Akses SSH VPS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Key className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">1. Kredensial Otentikasi SSH VPS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* IP Address Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Host / Public IP</span>
                <Globe className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold text-[#0f2942] font-mono mt-1">
                {vpsInfo.ip}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Port: {vpsInfo.port} (SSH)</span>
                <button
                  onClick={() => handleCopy('ip', vpsInfo.ip)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {copiedField === 'ip' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'ip' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Username Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Username SSH</span>
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-lg font-extrabold text-[#0f2942] font-mono mt-1">
                {vpsInfo.username}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Superuser (Root)</span>
                <button
                  onClick={() => handleCopy('user', vpsInfo.username)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {copiedField === 'user' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'user' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Password Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Password SSH</span>
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-lg font-extrabold text-[#0f2942] font-mono mt-1 flex items-center gap-2">
                <span>{showPassword ? vpsInfo.password : '••••••••••••••••'}</span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Password Otentikasi</span>
                <button
                  onClick={() => handleCopy('pass', vpsInfo.password)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {copiedField === 'pass' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'pass' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Quick Command Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs relative">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Perintah Remote</span>
                <Terminal className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xs font-bold text-[#0f2942] font-mono mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                {vpsInfo.sshCommand}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">Terminal Shell</span>
                <button
                  onClick={() => handleCopy('ssh', vpsInfo.sshCommand)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {copiedField === 'ssh' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'ssh' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Panduan Login SSH di Berbagai Sistem Operasi */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Terminal className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">2. Cara Terhubung ke VPS via SSH</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* PowerShell / CMD Windows */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#0f2942] flex items-center gap-2">
                <span>Pengguna Windows (PowerShell / Windows Terminal / CMD)</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Buka <strong>PowerShell</strong> atau <strong>Command Prompt</strong>, lalu jalankan perintah:
              </p>
              <CodeBlock
                language="bash"
                title="Windows PowerShell"
                code={`ssh root@202.155.17.57`}
              />
              <p className="text-slate-500 text-[11px] leading-relaxed">
                1. Jika muncul <em>"Are you sure you want to continue connecting (yes/no/[fingerprint])?"</em>, ketik <strong>yes</strong> lalu tekan Enter.<br />
                2. Masukkan password: <strong>{vpsInfo.password}</strong> (huruf password tidak akan terlihat di layar saat diketik, ini adalah standar keamanan Linux).
              </p>
            </div>

            {/* Linux / macOS Terminal */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#0f2942] flex items-center gap-2">
                <span>Pengguna Linux / macOS Terminal</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Buka aplikasi <strong>Terminal</strong> bawaan, lalu hubungkan secara langsung:
              </p>
              <CodeBlock
                language="bash"
                title="macOS / Linux Terminal"
                code={`ssh root@202.155.17.57`}
              />
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Alternatif menggunakan client GUI seperti <strong>PuTTY</strong>, <strong>Bitvise SSH</strong>, atau <strong>Termius</strong>:<br />
                • HostName: <code>{vpsInfo.ip}</code><br />
                • Port: <code>22</code><br />
                • User: <code>root</code> | Password: <code>{vpsInfo.password}</code>
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Cara Setup Otomatis di VPS Kosongan */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">3. Langkah Setup Otomatis di VPS Kosongan</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Setelah login via SSH ke VPS kosongan, Anda hanya perlu menjalankan 4 baris perintah berikut. Seluruh instalasi (Node.js v22, PM2, Backend Express, SQLite, build React, Sertifikat SSL, dan Nginx Reverse Proxy) akan diselesaikan otomatis:
            </p>

            <CodeBlock
              language="bash"
              title="Eksekusi di Terminal VPS (Root)"
              code={`# 1. Clone repository project
git clone https://github.com/ImamAriadi2022/Dashboard-Monitoring-Udara.git

# 2. Masuk ke direktori project
cd Dashboard-Monitoring-Udara

# 3. Beri izin eksekusi script deploy
chmod +x setup-production.sh

# 4. Jalankan deploy otomatis production
./setup-production.sh`}
            />

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 leading-relaxed">
              <strong>Hasil Akhir Otomatisasi:</strong>
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-emerald-800">
                <li>Frontend React di-build ke folder <code>frontend/dist</code>.</li>
                <li>Backend Express aktif di background via PM2 dengan nama <code>air-backend</code>.</li>
                <li>Sertifikat Self-Signed SSL dibuat otomatis untuk IP <code>{vpsInfo.ip}</code>.</li>
                <li>Nginx aktif di port 443 (HTTPS) dengan reverse proxy <code>/api/</code> ke backend.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Prompt AI Agent untuk Production */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <FileCode className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">4. Prompt untuk AI Agent di Production VPS</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika VPS Anda memiliki AI Agent atau asisten CLI (seperti Antigravity, Claude Code, Aider, dll.), Anda cukup menyalin prompt di bawah ini:
            </p>

            <CodeBlock
              language="markdown"
              title="Prompt Siap Pakai untuk AI Agent VPS"
              code={`Tolong deploy dan konfigurasikan project Dashboard-Monitoring-Udara ini secara menyeluruh di VPS saya (IP: 202.155.17.57). VPS ini masih kosongan (fresh install Ubuntu) dan saya belum memiliki domain (akses via Public IP dengan SSL HTTPS).

Jalankan langkah-langkah berikut secara berurutan:
1. Update apt dan install paket dasar: curl, git, build-essential, nginx, openssl, ufw.
2. Install Node.js v22 LTS dari NodeSource dan install PM2 global (npm install -g pm2).
3. Buat Self-Signed SSL Certificate untuk IP 202.155.17.57 di /etc/ssl/certs/nginx-selfsigned.crt dan /etc/ssl/private/nginx-selfsigned.key.
4. Setup Backend: masuk ke folder 'backend', jalankan 'npm install', inisialisasi database dengan 'node seed_data.js', lalu jalankan service dengan 'pm2 start bridge.js --name "air-backend"' dan 'pm2 save'.
5. Setup Frontend: masuk ke folder 'frontend', jalankan 'npm install' dan 'npm run build'.
6. Konfigurasikan Nginx di /etc/nginx/sites-available/air-dashboard:
   - Port 80 redirect otomatis (301) ke HTTPS port 443.
   - Port 443 SSL menggunakan sertifikat yang dibuat.
   - Root direktori mengarah ke 'frontend/dist' dengan 'try_files $uri $uri/ /index.html;'.
   - Reverse proxy location '/api/' mengarah ke 'http://127.0.0.1:3000/'.
7. Aktifkan konfigurasi Nginx, reload web server, dan pastikan firewall membuka port 80, 443, dan 22.
8. Berikan ringkasan URL akses HTTPS dan status service PM2.`}
            />
          </div>
        </section>

        {/* Section 5: Perintah Pemeliharaan Harian */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <HardDrive className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">5. Perintah Pemeliharaan Rutin Server</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* PM2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
              <span className="font-bold text-[#0f2942] block">Manajemen Backend (PM2)</span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Mengelola proses background Node.js Express.
              </p>
              <CodeBlock
                language="bash"
                title="Perintah PM2"
                code={`# Cek status service
pm2 status

# Cek log data masuk
pm2 logs air-backend

# Restart service
pm2 restart air-backend`}
              />
            </div>

            {/* Nginx */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
              <span className="font-bold text-[#0f2942] block">Manajemen Web Server (Nginx)</span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Mengontrol web server frontend dan reverse proxy SSL.
              </p>
              <CodeBlock
                language="bash"
                title="Perintah Nginx"
                code={`# Tes sintaks konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Status Nginx
sudo systemctl status nginx`}
              />
            </div>

            {/* SQLite & Firewall */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2.5">
              <span className="font-bold text-[#0f2942] block">Database SQLite & Firewall</span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Pemeriksaan data sensor dan status port keamanan.
              </p>
              <CodeBlock
                language="bash"
                title="Pemeriksaan Data"
                code={`# Cek status firewall
sudo ufw status

# Cek jumlah data SQLite
cd backend
node -e "const db=require('better-sqlite3')('air_data.db'); console.log(db.prepare('SELECT count(*) FROM readings').get());"`}
              />
            </div>
          </div>
        </section>

        {/* Section 6: Rekomendasi Keamanan Server */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-[#0f2942]">6. Rekomendasi Keamanan Produksi</h2>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3 text-xs leading-relaxed text-slate-600">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block text-sm">Ganti Password Default Setelah Setup Awal:</strong>
                <p className="text-slate-500 mt-0.5">
                  Untuk keamanan jangka panjang, Anda disarankan mengganti password root dengan menjalankan perintah <code>passwd</code> pada terminal VPS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block text-sm">Gunakan SSH Key Authentication:</strong>
                <p className="text-slate-500 mt-0.5">
                  Gunakan perintah <code>ssh-copy-id root@{vpsInfo.ip}</code> dari komputer lokal Anda untuk login instan tanpa perlu mengetikkan password berulang kali.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
