🔥 READY STOCK PANEL PTERODACTYL LEGAL 🔥

Butuh panel server kencang, legal, dan tahan banting? Langsung order sekarang!

• RAM 1GB - 8GB Available
• Support Semua Bot & Server
• Full Garansi + Free Setup

🛒 Order Direct: https://zanspiwptero.shoppanel.my.id




# 🥶 GOJO SATORU MD V2 — v2.0.0 Infinity Edition

> **Bot WhatsApp paling kuat** — 1300+ command (dihitung langsung dari command
> yang benar-benar terdaftar lewat `.totalfitur`, bukan angka kira-kira), RPG
> lengkap, sistem proteksi canggih (termasuk **Anti-NSFW**), dan banyak lagi.
> Dibangun dengan Baileys Multi-Device. Siap deploy di **Pterodactyl**.

---

## ✨ Fitur Unggulan v3.0.0

| Fitur | Keterangan |
|-------|-----------|
| 🔄 **Auto-Read** | Pesan otomatis ditandai dibaca (centang biru) sebelum bot balas |
| ⌨️ **Auto-Typing** | Indikator "mengetik..." muncul saat bot memproses command |
| ⏳ **Cooldown System** | Anti-spam command per user, per kategori, configurable |
| 🛡️ **Anti-Flood** | Blokir flood agresif (4 pesan dalam 3 detik) |
| 📊 **Analytics** | Statistik command terpopuler, jumlah user & grup |
| 🎨 **Logger Berwarna** | Output terminal yang cantik & mudah dibaca |
| 🔁 **Reconnect Cerdas** | Exponential backoff — makin lama gagal, makin lama delay |
| 📈 **Stats di Menu** | Menu utama menampilkan data real-time (user, grup, command) |

---

## 📦 Kategori Fitur

### ⚔️ RPG (280+ command)
- Buat karakter dengan 4 class (Warrior, Mage, Archer, Rogue)
- Sistem pertarungan: Hunt monster, Duel PvP, Raid Boss, Dungeon
- Ekonomi lengkap: Toko, Bank, Transfer, Kerja, Rob
- Pet System, Quest, Achievement, Gacha, Ekspedisi
- Crafting, Refine, Training, Prestige
- Gambling: Taruhan gold & Lotre
- Ranking & Leaderboard global

### 🛡️ Admin Grup (300+ command)
- Manajemen member: Kick, Promote, Demote, Add, **Kick All**, **Warn All**
- Sistem Warn dengan auto-kick + `.cekwarnall` / `.topwarn` / `.resetwarnall`
- Mute grup (durasi) **+ Mute per-member** individual (`.mutemember`)
- Lock grup, dan lock granular per jenis konten: Media, Stiker, Gambar,
  Video, Dokumen, Kontak, Lokasi, Voice Note, Audio, GIF, Polling
- Welcome & Farewell custom dengan variabel
- Slowmode (+ `.slowmodeoff`), Poll, Jadwal, Laporan, Auto-reply
- **Proteksi lengkap**: Anti-spam, Anti-toxic (+ custom bad-word per grup),
  Anti-link (+ link allowlist), Anti-GB, Anti-ShortLink, Anti-Flood,
  **Anti-Link-Phising**, **Anti-Judol**, **Anti-Pinjol**,
  **Anti-Caps**, **Anti-Virtex**, **Anti-Tag**,
  **Anti-NSFW** (v3.2.0 — deteksi & hapus otomatis foto/video/stiker
  dewasa + `.hapusnsfw` untuk hapus manual, lihat bagian tersendiri di
  bawah) — semua bisa dilihat statusnya lewat `.grouplockstatus`
- **Whitelist proteksi** per-member (`.whitelistadd`) supaya member
  tertentu bebas dari proteksi baru di atas
- **Approval Join Request**: lihat/terima/tolak permintaan join grup mode
  "Perlu Persetujuan Admin" (`.listrequest`, `.approverequest`, dst)
- **Jadwal buka/tutup grup otomatis** tiap hari (`.jadwalbuka` / `.jadwaltutup`)
- **Backup/restore pengaturan grup** (`.backupsetting` / `.restoresetting`)
- Ganti/hapus foto grup dari chat (`.seticon`/`.hapusicon`), kunci info
  grup (`.lockinfo`), pesan sementara (`.ephemeral`)
- Dashboard grup (`.groupsummary`), umur grup, jumlah admin, data member
- Statistik aktivitas grup
- **Sider Detector**: deteksi member yang gak pernah/jarang chat (`.sider`),
  langsung kick semua sekaligus (`.kicksider`) — admin grup otomatis dikecualikan

### 🎮 Fun & Game (190+ command)
- Mini game: Trivia, Wordscramble, Riddle, Higher-Lower
- Truth or Dare, WYR, Tebak Angka, Slot, RPS
- Komedi: Dad Joke, Konspirasi Lucu, Roast, Pujian
- Tarot, Fortune Cookie, Zodiak, Jodoh
- Kata Harian, Mood, Afirmasi, Emoji Random

### 🛠️ Tools (220+ command)
- Teks: Upper/Lower/Reverse/Leet/ROT13 + 15 transformasi lainnya
- Enkripsi: Binary, Base64, Hex, Morse, Caesar, ASCII
- Matematika: Kalkulator, BMI, Prima, Faktorial, Fibonacci, FPB/KPK
- Konversi: Panjang, Berat, Suhu
- Keuangan: Diskon, SplitBill, Tip
- Validator: Email, NoHP, CC, Password Strength
- Generator: Password, UUID, Random Color, Pilih Acak

### 🖼️ Media — Brat & IQC
- `.brat <teks>` — **Sticker** WebP putih polos + teks hitam, ala tren "brat" (Charli XCX). Bisa juga reply pesan teks lalu ketik `.brat` tanpa argumen tambahan.
- `.bratgreen <teks>` — Sama seperti `.brat`, background hijau ala warna asli album "Brat".
- `.bratwhite <teks>` — Sama seperti `.brat` (background putih, teks hitam).
- `.iqc <teks>` — Bubble chat ala WhatsApp asli, dikirim sebagai gambar biasa (bukan sticker, karena bentuknya tidak persegi).
- Gambar brat digenerate lewat API remote (`brat.siputzx.my.id`), lalu dikonversi jadi sticker WebP di sisi bot memakai `ffmpeg-static` — tidak butuh compiler/native build tambahan, instalasi tetap ringan untuk Pterodactyl.

> 💡 Variant brat sengaja dibatasi cuma 3 command di atas (`.brat`/`.bratgreen`/`.bratwhite`). Variant tematik & video/animasi lain sudah tidak tersedia.

---

## 🚀 Cara Deploy

> ⚙️ **Persyaratan:** Node.js **20.0.0 ke atas** untuk ketiga cara deploy di bawah (cek dengan `node -v`). Baileys dan beberapa dependency lain sudah tidak mendukung Node 18 ke bawah.

### Pterodactyl Panel
1. Upload file ini ke server Pterodactyl
2. Set **Startup Variable** `NOMOR_HP` = nomor HP kamu (contoh: `628123456789`)
3. Jalankan bot — kode pairing akan muncul di console
4. Buka WA → Setelan → Perangkat Tertaut → Tautkan dengan Nomor Telepon
5. Masukkan kode pairing dalam 60 detik

> 💡 **Lupa isi `NOMOR_HP`?** Tidak masalah — begitu bot start dan mendeteksi nomor belum diisi (di ENV maupun `setting.js`), bot akan **tanya langsung di console**: ketik nomornya (format `628xxxxxxxxxx`) lalu Enter, bot lanjut sendiri ke proses pairing. Kalau di panel kamu ternyata console-nya tidak bisa kirim input ke bot (tergantung konfigurasi egg-nya), bot akan bilang jelas lewat log setelah beberapa saat menunggu — solusinya isi `NOMOR_HP` lewat Startup Variable seperti langkah 2 di atas, itu selalu berhasil di Pterodactyl terlepas dari console-nya bisa terima input langsung atau tidak.

> 💡 **Masih lihat banyak `npm warn deprecated` saat install?** Sejak v3.2.1 dependency utama (Baileys, node-cache) sudah dibarukan ke versi yang aktif di-maintain, jadi warning dari keduanya seharusnya sudah jauh berkurang. Sisa warning yang mungkin masih muncul umumnya dari dependency transitif yang lebih dalam lagi (dependency dari dependency) — ini normal untuk project Node manapun dan **tidak menandakan ada yang salah/gagal terinstall**; kalau ingin log instalasi lebih bersih untuk dibaca, jalankan `npm install --loglevel=error`.

### VPS / Lokal
```bash
# Install dependencies
npm install

# Isi nomor di setting.js
# nomorPairing: '628xxx'

# Jalankan
npm start
```

> 💡 `.brat`/`.bratgreen`/`.bratwhite`/`.antinsfw` (untuk video) butuh ffmpeg. Secara default lewat `ffmpeg-static` (sudah ada di `package.json`, otomatis terinstall lewat `npm install` di atas — tidak perlu compiler/toolchain tambahan). Kalau package ini gagal terinstall/jalan di server, command terkait akan memberi pesan jelas saat dipanggil (bukan crash bot) — dan sejak v3.2.1, bot juga otomatis fallback ke ffmpeg sistem (dari PATH) kalau ada.

### 📱 Termux (Android) — v3.2.1
Bot ini bisa dijalankan langsung dari HP Android lewat [Termux](https://f-droid.org/packages/com.termux/) (install dari F-Droid, bukan Play Store — versi Play Store sudah tidak di-update), tanpa VPS/panel sama sekali.

```bash
# 1. Update paket Termux, lalu install Node.js LTS, git, dan ffmpeg
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg

# 2. Pastikan Node-nya 20 ke atas (lihat catatan di bawah kalau belum)
node -v

# 3. Masuk ke folder project (hasil ekstrak/clone), lalu install dependencies
cd Gojo-Satoru-MD-V2
npm install

# 4. Isi nomor di setting.js (nomorPairing: '628xxx'), lalu jalankan
npm start

# (opsional tapi disarankan) supaya Termux tidak gampang dimatikan Android
# di background saat layar HP mati:
termux-wake-lock
```

> 💡 **`node -v` masih di bawah 20?** Jalankan `pkg install nodejs` (versi terbaru, bukan `-lts`) untuk mengambil versi paling baru yang tersedia di repo Termux.

> 💡 **Kenapa perlu `pkg install ffmpeg` manual di Termux?** `ffmpeg-static` di `package.json` men-download binary ffmpeg yang dikompilasi untuk Linux glibc biasa — binary itu **tidak bisa jalan** di Android/Termux (Termux pakai Bionic libc, beda dari glibc), meskipun `npm install`-nya sendiri tidak akan error. Sejak v3.2.1, bot otomatis fallback ke ffmpeg SISTEM (hasil `pkg install ffmpeg` di atas) kalau binary `ffmpeg-static` terdeteksi tidak valid — jadi tidak perlu setting tambahan apa pun, command `.brat`/`.antinsfw` (bagian video) tetap berfungsi normal di Termux.

> 💡 Supaya bot tetap jalan walau aplikasi Termux ditutup/di-swipe, jalankan di dalam sesi `tmux`/`screen` (`pkg install tmux`), atau pasang Termux:Boot untuk auto-start setelah HP restart.

---


## ⚙️ Konfigurasi (setting.js)

Semua konfigurasi ada di `setting.js`. Yang paling penting:

```js
ownerName:   'Nama Kamu',
ownerNumber: '628xxx',      // Nomor owner (tanpa + atau spasi)
botName:     'Nama Bot',
prefix:      '.',           // Ganti prefix jika perlu
nomorPairing: '628xxx',     // Nomor yang akan login sebagai bot

// Fitur baru v3.0.0:
autoRead:    true,          // Auto centang biru
autoTyping:  true,          // Auto typing indicator
cooldownEnabled: true,      // Sistem cooldown
cooldowns: {
    rpg:   8000,            // Cooldown RPG: 8 detik
    admin: 2000,            // Cooldown admin: 2 detik
    fun:   3000,            // Cooldown fun: 3 detik
    tools: 1500,            // Cooldown tools: 1.5 detik
    menu:   500,            // Cooldown menu: 0.5 detik
},
```

---

## 📁 Struktur File

```
bot-v3/
├── index.js              — Entry point (reconnect cerdas, banner)
├── setting.js            — Konfigurasi lengkap
├── features/
│   ├── protection.js     — Anti-GB, Link, Spam, Toxic, Flood
│   └── protectionExtra.js— 🆕 v3.1.0: Anti-Phising/Promosi/Judol/Pinjol/
│                            Caps/Virtex/Tag/Fake, whitelist, bad-word &
│                            link allowlist, mute per-member
├── lib/
│   ├── logger.js         — 🆕 Logger terminal berwarna
│   ├── cooldown.js       — 🆕 Sistem cooldown per user
│   ├── messagePipeline.js— Auto-read, typing, cooldown check
│   ├── groupScheduler.js — 🆕 v3.1.0: jadwal buka/tutup grup otomatis
│   ├── db.js             — Database JSON + analytics
│   ├── utils.js          — Helper functions
│   ├── roles.js          — Creator/Owner/Premium (jabatan)
│   ├── imageGen.js        — 🆕 Render piksel iqc (tanpa dependency gambar)
│   ├── stickerGen.js       — 🆕 Encode sticker WebP via webp-wasm
│   ├── videoGen.js        — 🆕 Konversi gambar brat (API remote) jadi sticker WebP via ffmpeg
│   ├── childBot.js       — Jadibot manager
│   ├── rpgData.js        — Data RPG (monster, item, dll)
│   └── rpgEngine.js      — Logika RPG
└── commands/
    ├── index.js          — Router semua command
    ├── menu.js            — 🆕 Menu yang didesain ulang
    ├── bratCommands.js    — 🆕 .brat, .bratgreen, .bratwhite, .iqc
    ├── rpgCommands*.js   — Command RPG (5 file)
    ├── adminCommands*.js — Command admin (4 file — adminCommands4.js 🆕 v3.1.0)
    ├── funCommands*.js   — Command fun (3 file)
    ├── toolsCommands*.js — Command tools (3 file)
    └── ...
```

---

## 🛡️ Sistem Proteksi

Aktifkan per grup dengan command admin:

| Command | Fungsi |
|---------|--------|
| `.antigb on/off` | Blokir link grup WA lain |
| `.antilink on/off` | Blokir semua URL (kecuali domain di `.allowlinkadd`) |
| `.antishortlink on/off` | Blokir bit.ly, tinyurl, s.id, dll |
| `.antilinkphising on/off` | Blokir link/pola phising (verifikasi akun palsu, klaim hadiah palsu, dll) |
| `.antispam on/off` | Blokir spam (6 pesan/10 detik) + Anti-Flood (4 pesan/3 detik) |
| `.antitoxic on/off` | Blokir kata-kata kasar (+ kata custom lewat `.addbadword`) |
| `.antijudol on/off` | Blokir promosi judi online (slot/togel/dll) |
| `.antipinjol on/off` | Blokir promosi pinjaman online ilegal |
| `.anticaps on/off` | Blokir pesan HURUF KAPITAL berlebihan |
| `.antivirtex on/off` | Blokir teks "virus" (zalgo/unicode berlebihan) |
| `.antitag on/off` | Blokir spam mention massal oleh non-admin |
| `.antinsfw on/off` | Deteksi & hapus otomatis foto/video/stiker dewasa (v3.2.0) |

Command bantu: `.resetprotection`
(matikan semua), `.grouplockstatus` (lihat status lengkap), `.helpproteksi`
(cheatsheet ringkas), `.whitelistadd` (kecualikan 1 member dari semua proteksi
di atas). Lock granular per jenis konten (gambar/video/dokumen/kontak/lokasi/
voice note/audio/GIF/polling) tersedia lewat `.lockimage`, `.lockvideo`, dst —
lihat `.menuadmin` untuk daftar lengkap.

### 🔞 Anti-NSFW (v3.2.0)

Fitur admin untuk mendeteksi & menghapus foto/video/stiker dewasa secara
otomatis, ditambah command manual untuk admin:

| Command | Fungsi |
|---------|--------|
| `.antinsfw on/off` | Aktifkan/nonaktifkan deteksi otomatis di grup ini |
| `.hapusnsfw` | Reply foto/video/stiker lalu hapus paksa + strike (tidak butuh API apa pun) |
| `.cekstrikensfw @tag` | Cek jumlah strike NSFW seorang member |
| `.resetnsfwstrike @tag` | Reset strike NSFW seorang member |
| `.setnsfwlimit [angka]` | Atur jumlah strike sebelum auto-kick (default: 3) |

**Penting soal deteksi OTOMATIS**: `.hapusnsfw` (manual) selalu jalan tanpa
syarat apa pun. Tapi supaya `.antinsfw on` bisa **mendeteksi sendiri** konten
dewasa (bukan cuma menghapus yang di-reply admin), kamu perlu isi API key
gratis di `setting.js` bagian `nsfwDetection`:

1. Daftar akun gratis di https://console.pixlab.io
2. Ambil API key dari dashboard
3. Isi ke `settings.nsfwDetection.apiKey` di `setting.js` (atau ENV
   `NSFW_API_KEY`, lebih aman kalau `setting.js` pernah kamu bagikan ke
   orang lain)

Selama API key belum diisi, `.antinsfw on` tetap bisa dinyalakan tanpa
error — deteksi otomatisnya saja yang belum aktif (sistem ini sengaja
**fail-open**: kalau API tidak terkonfigurasi/gagal/timeout, bot TIDAK akan
menghapus pesan orang secara asal, supaya tidak pernah salah hapus). Ingin
pakai provider deteksi lain? Isi `customApiUrl` di blok yang sama — detail
kontrak API-nya ada di komentar `lib/nsfwDetector.js`.

---

## 🎵 Catatan soal Fitur `.play`, `.ig`, & `.tiktok`

Sebelumnya fitur `.play` pakai library `@distube/ytdl-core`. Per Agustus 2025,
**repository itu sudah di-archive** oleh pemiliknya — artinya sudah tidak ada
update lagi untuk mengikuti perubahan sistem anti-bot YouTube. Itu sebabnya
kalau kamu pernah lihat error seperti ini:

```
❌ Gagal mengunduh audio:
Status code: 403
```

...itu **bukan bug di bot ini** — itu YouTube yang menolak request dari
library yang sudah ditinggalkan tersebut. Hampir semua bot WhatsApp yang
masih pakai `ytdl-core`/`@distube/ytdl-core` mengalami masalah yang sama.

**Solusinya:** fitur `.play`, `.ig`, dan `.tiktok` semuanya memakai
[`yt-dlp`](https://github.com/yt-dlp/yt-dlp) — project terpisah (bukan
library Node.js) yang di-update jauh lebih sering mengikuti perubahan
YouTube/Instagram/TikTok, dan satu binary ini cukup untuk ketiga platform
sekaligus (tidak perlu dependency terpisah per platform). Bot ini akan
**otomatis download binary `yt-dlp`** (versi standalone Linux yang sudah
membundel Python sendiri — TIDAK perlu install Python apapun di
server/Pterodactyl) ke folder `bin/` saat salah satu dari ketiga command
ini pertama kali dipanggil. Proses ini butuh:

- Akses internet dari server ke `github.com` (sekali saja, untuk download).
- Beberapa detik ekstra di pemanggilan PERTAMA (download binary).
  Pemanggilan selanjutnya (dari command manapun di antara ketiganya)
  langsung pakai binary yang sudah ada.

Kalau server kamu tidak punya akses ke `github.com` (firewall ketat dll),
download manual binary "yt-dlp" (Linux) dari
[halaman rilis resmi](https://github.com/yt-dlp/yt-dlp/releases/latest),
lalu letakkan di `bin/yt-dlp` (folder `bin/` sejajar dengan `index.js`) dan
jalankan `chmod +x bin/yt-dlp`.

**Kalau suatu saat salah satu fitur ini mulai gagal lagi** (YouTube/
Instagram/TikTok sering ubah-ubah mekanisme mereka), kemungkinan besar
`yt-dlp` di server kamu sudah ketinggalan versi. Hapus file `bin/yt-dlp`,
lalu jalankan salah satu command tersebut lagi — bot akan otomatis
download ulang versi terbaru.

**Soal tombol "ambil audio" di bawah video `.ig`/`.tiktok`:** itu fitur
NATIVE WhatsApp client sendiri untuk SEMUA pesan video (bukan sesuatu yang
diatur bot) — jadi otomatis muncul tanpa bot perlu melakukan apapun. Tombol
ini sedang di-rollout WhatsApp secara bertahap, jadi belum semua device/
versi WhatsApp mendapatkannya — kalau di device kamu belum muncul, itu
bukan masalah dari sisi bot.

**Soal konten private:** `.ig`/`.tiktok` hanya bisa download konten
PUBLIK. Post/akun yang di-private oleh pemiliknya tidak bisa diunduh
(ini bukan keterbatasan bot, tapi memang dijaga oleh Instagram/TikTok
sendiri).

**Kenapa `.ig` lebih sering gagal dibanding `.tiktok`:** Instagram jauh
lebih agresif membatasi akses tanpa login dibanding TikTok — sering muncul
error "login required" atau "rate-limit reached" walau link-nya publik dan
benar. Ini masalah dari pihak Instagram (mereka mengunci halaman di balik
login page), bukan bug di bot — dan ini berubah-ubah dari hari ke hari
tergantung seberapa agresif Instagram saat itu. Bot ini sudah otomatis:

- Memakai user-agent mobile khusus untuk request ke Instagram (kadang
  membantu lolos dari deteksi tersebut, walau tidak selalu).
- Menerjemahkan error teknis yt-dlp ("exit code 1", "rate-limit", dst)
  jadi pesan yang jelas — kalau muncul pesan "Instagram sedang membatasi
  akses...", itu memang dari sisi Instagram, coba lagi beberapa menit
  lagi atau coba link lain.

Solusi 100% permanen untuk masalah ini butuh **cookies dari akun
Instagram asli** yang sudah login (lihat dokumentasi yt-dlp soal
`--cookies-from-browser`/`--cookies`), tapi ini punya risiko (akun bisa
kena rate-limit/flag dari Instagram) dan butuh maintenance manual
(cookies expire), jadi TIDAK diaktifkan secara default di bot ini.

---

## 🔐 Catatan soal Session yang Sering Rusak (badSession)

**Kenapa ini terjadi:** Baileys (`useMultiFileAuthState`) menulis BANYAK
file kecil ke folder `session/` setiap kali kunci enkripsi berubah —
yaitu hampir setiap kali ada pesan masuk/keluar. Ini perilaku resmi
Baileys (bahkan dokumentasi resminya sendiri bilang fungsi ini "tidak
direkomendasikan untuk level produksi", cuma cocok untuk bot kecil).

Kalau proses Node mati **persis** saat salah satu file itu sedang
ditulis — restart paksa lewat Pterodactyl (klik Restart/Kill), container
ke-OOM-kill, atau crash — file itu jadi setengah-tertulis alias corrupt.
Begitu SATU file corrupt, Baileys akan menganggap SELURUH auth state
tidak valid (`badSession`) saat connect berikutnya.

**Yang sudah diperbaiki di bot ini:**

1. **Graceful shutdown yang benar** — sebelumnya `SIGTERM`/`SIGINT`
   (sinyal "sopan" yang dikirim Pterodactyl saat Restart/Stop normal)
   langsung memanggil `process.exit()` tanpa menunggu apapun, padahal
   Baileys mungkin masih menulis file di background. Sekarang bot
   menunggu (`await`) penyimpanan kredensial selesai dulu sebelum benar-
   benar berhenti.
2. **Auto-backup folder `session/`** — setiap kali koneksi berhasil
   terbuka (dan secara berkala tiap `sessionBackupIntervalMinutes` menit,
   default 30 menit, bisa diubah di `setting.js`), folder `session/`
   disalin ke `session-backup/` — TAPI hanya kalau isinya valid (ada
   `creds.json`), supaya tidak ikut membackup state yang corrupt. Kalau
   suatu saat `session/` ternyata rusak, kamu punya cadangan untuk
   dipulihkan manual (copy isi `session-backup/` ke `session/`) tanpa
   harus pairing dari nol.

**Yang TIDAK bisa diperbaiki dari sisi kode:** sinyal `SIGKILL` (kill -9)
— misalnya kalau Pterodactyl/server langsung mematikan proses tanpa
pemberitahuan apapun — tidak bisa di-intercept oleh proses Node manapun,
jadi tidak ada cara untuk "menyelamatkan" penulisan file yang sedang
berjalan dalam kasus itu. Ini bukan keterbatasan bot, tapi keterbatasan
fundamental sistem operasi/Node.js.

---

## ⚠️ Catatan soal Akun "@lid"

WhatsApp sedang merilis sistem ID baru bernama **LID (Linked Identifier)**.
Sebagian akun (biasanya akun baru atau akun bisnis) kadang dikenali bot
dengan ID berbentuk `xxxxx@lid` BUKAN nomor HP biasa (`628xxx@s.whatsapp.net`).
Angka di depan `@lid` itu **bukan nomor HP asli** — itu ID acak internal
milik WhatsApp.

Bot ini sudah berusaha menukar `@lid` ke nomor HP asli kalau WhatsApp
menyediakan datanya (lewat field `participantPn`/`senderPn` di Baileys).
Tapi ini keterbatasan dari WhatsApp/Baileys sendiri, bukan dari bot — di
chat pribadi, **kadang WhatsApp tidak memberi tahu nomor aslinya sama
sekali**, dan baru "sadar" identitas sebenarnya di pesan-pesan berikutnya.

Dampaknya kalau kamu (Owner) atau user lain mengalami ini:
- `.daftar` kamu lakukan, tapi di pesan lain `.nomorku`/command lain malah
  diblokir lagi "belum terdaftar" — itu tandanya WhatsApp mengirim ID
  yang berbeda untuk pesan yang berbeda dari nomor yang sama.
- `.nomorku` akan memberi tahu dengan jelas kalau akunmu sedang terdeteksi
  sebagai `@lid` (bukan diam-diam menampilkan ID itu seolah nomor HP asli).
- Kalau ini terjadi pada nomor Owner/Creator, sementara waktu command bisa
  saja ditolak di pesan tertentu. Coba kirim ulang pesan teks biasa
  (bukan reply ke pesan lama) — biasanya WhatsApp akan kembali mengirim
  identitas nomor HP normal setelah beberapa pesan.

Belum ada solusi 100% dari pihak Baileys untuk masalah ini per saat
project ini dibuat — bot akan otomatis ikut lebih baik begitu Baileys
merilis perbaikan lebih lanjut untuk pemetaan `@lid`.

---

## ⚡ Changelog v3.2.1

- ✅ **Minimum Node.js naik ke v20.0.0** — diset di `engines` pada
  `package.json`. Baileys versi terbaru sudah mensyaratkan ini juga.
- ✅ **Dependency dibarukan** — `@whiskeysockets/baileys` naik dari `6.7.23`
  (sudah ditandai *legacy* oleh maintainer-nya) ke `^6.17.16` (rilis terbaru
  di jalur 6.x yang sama, JADI TIDAK ADA breaking change — sengaja TIDAK
  loncat ke `7.0.0-rc` karena versi itu masih rilis percobaan/release
  candidate dengan beberapa laporan bug stabilitas koneksi). `node-cache`
  yang sudah 6 tahun tidak di-update diganti ke penerus resminya,
  `@cacheable/node-cache` (kompatibel 1:1, tinggal ganti nama import).
  Perubahan ini seharusnya membuat `npm warn deprecated` yang muncul saat
  install jauh berkurang — sisa warning dari dependency transitif yang
  lebih dalam lagi itu wajar untuk project Node manapun.
- ✅ **Dukungan Termux (Android)** — lihat subbagian "📱 Termux (Android)"
  di atas untuk cara install lengkap. Termasuk perbaikan `lib/videoGen.js`
  supaya otomatis fallback ke ffmpeg SISTEM (`pkg install ffmpeg`) kalau
  binary bawaan `ffmpeg-static` tidak jalan (kasus umum di Android, karena
  perbedaan glibc vs Bionic libc) — jadi `.brat`/`.antinsfw` (bagian video)
  tetap berfungsi di Termux tanpa setting tambahan.

---

## ⚡ Changelog v3.2.0

- ✅ **Anti-NSFW** — fitur admin baru buat deteksi & hapus otomatis
  foto/video/stiker dewasa yang masuk ke grup (`.antinsfw on/off`), plus
  command manual `.hapusnsfw` (reply lalu hapus paksa, tidak butuh setup
  apa pun) dan sistem strike/auto-kick (`.cekstrikensfw`,
  `.resetnsfwstrike`, `.setnsfwlimit`). Lihat bagian "🔞 Anti-NSFW" di atas
  untuk cara aktifkan deteksi otomatisnya (butuh API key gratis).
- ✅ **Total command tembus 900+** — dihitung LANGSUNG dari command yang
  benar-benar terdaftar (bukan angka kira-kira) lewat `.totalfitur`,
  ditambah 20 command baru: kalkulator fisika (`.ohm`, `.energikinetik`,
  `.gayagravitasi`, `.jarakproyektil`, `.percepatan`), matematika
  (`.faktorprima`, `.fpbstep`, `.matrixtambah`, `.matrixkali`), konverter
  (`.konversidata`, `.konversidaya`), kesehatan (`.persentaselemak`,
  `.pacelari`), dan hiburan (`.shiozodiak`, `.artimimpi`, `.warnahoki`,
  `.elementzodiak`, `.namatim`, `.julukananime`, `.namakerajaan`).

---

## ⚡ Changelog v3.1.0

- ✅ **300+ Command Admin Baru** — total fitur naik dari 900+ jadi **1200+**,
  hampir semuanya di kategori Admin/Grup (lihat `.menuadmin` & `.totalfitur`)
- ✅ **Proteksi Baru** — `.antilinkphising`, `.antijudol`,
  `.antipinjol`, `.anticaps`, `.antivirtex`, `.antitag`
- ✅ **Anti-Flood Akhirnya Aktif** — fungsinya sudah ada sejak lama tapi
  belum pernah benar-benar terpasang di alur pesan; sekarang jalan otomatis
  bareng `.antispam`
- ✅ **Lock Konten Granular** — `.lockmedia`/`.lockstiker` lama tetap jalan,
  ditambah 9 jenis baru: `.lockimage`, `.lockvideo`, `.lockdocument`,
  `.lockcontact`, `.locklocation`, `.lockvn`, `.lockaudio`, `.lockgif`, `.lockpoll`
- ✅ **Custom Bad-Word & Link Allowlist** — `.addbadword`/`.delbadword` untuk
  memperluas `.antitoxic` per grup, `.allowlinkadd`/`.allowlinkdel` untuk
  mengecualikan domain tertentu dari `.antilink`
- ✅ **Whitelist Proteksi** — `.whitelistadd` membebaskan member tertentu
  dari semua proteksi baru di atas
- ✅ **Mute Per-Member** — `.mutemember` membisukan 1 orang tanpa membisukan
  seluruh grup (beda dari `.mute` yang lama)
- ✅ **Kick All / Warn All** — `.kickall yakin` & `.warnall` untuk aksi massal
  ke semua non-admin, plus `.cekwarnall`/`.topwarn`/`.resetwarnall`
- ✅ **Approval Join Request** — `.listrequest`, `.approverequest`,
  `.rejectrequest`, `.approveall`, `.rejectall` untuk grup mode "Perlu
  Persetujuan Admin"
- ✅ **Jadwal Buka/Tutup Grup Otomatis** — `.jadwalbuka`/`.jadwaltutup`
  (dicek tiap menit oleh `lib/groupScheduler.js`, lihat status di `.cekjadwalgrup`)
- ✅ **Backup/Restore Setting Grup** — `.backupsetting`/`.restoresetting`
- ✅ **Ganti Foto Grup dari Chat** — `.seticon` (reply gambar)/`.hapusicon`,
  plus `.lockinfo`/`.unlockinfo` (kunci siapa saja yang boleh ubah info grup)
  dan `.ephemeral` (pesan sementara)
- ✅ **Dashboard Grup** — `.groupsummary`, `.grouplockstatus`, `.groupage`,
  `.admincount`, `.groupcreator`, `.exportmember`, `.cekbot`
- ✅ **Ban List Lebih Lengkap** — `.banlist` (lihat daftar blokir bot) &
  `.unbanall`, plus member yang di-ban otomatis dikeluarkan lagi kalau
  mencoba join ulang grup

## ⚡ Changelog v3.0.0

- ✅ **Session Lebih Tahan Rusak** — Graceful shutdown menunggu penyimpanan kredensial selesai (mencegah corrupt saat restart), plus auto-backup `session/` ke `session-backup/` (lihat bagian "Catatan soal Session yang Sering Rusak" di atas)
- ✅ **Wajib Daftar** — `.daftar nama.umur` sebelum bisa pakai command lain (Owner/Creator bypass)
- ✅ **`.brat` Jadi Sticker** — Tema putih-hitam, dikirim sebagai sticker WebP asli (bukan gambar biasa)
- ✅ **Fix Identitas @lid** — Resolusi nomor HP asli lebih akurat (lihat bagian "Catatan soal Akun @lid" di atas)
- ✅ **`.allmenu` Didesain Ulang** — Tampilan kotak per kategori, lebih rapi
- ✅ **Auto-Read + Auto-Typing** — Bot terasa lebih hidup
- ✅ **Cooldown System** — Per user, per kategori, bypass untuk owner
- ✅ **Anti-Flood** — Lebih agresif dari antispam biasa
- ✅ **Logger Berwarna** — Output Pterodactyl jauh lebih readable
- ✅ **Analytics** — Tracking command terpopuler, user, grup
- ✅ **Menu Didesain Ulang** — Lebih informatif dengan data real-time
- ✅ **Ping Diperkaya** — Tampilkan latensi, runtime, statistik
- ✅ **Runtime Command** — Tampilkan top 5 command terpopuler
- ✅ **Exponential Backoff** — Reconnect lebih cerdas
- ✅ **Error Handling** — Lebih robust, `uncaughtException` ditangani
- ✅ **Setting.js Diperluas** — 20+ opsi konfigurasi baru
- ✅ **`.totalfitur`** — Tampilkan jumlah total command/fitur bot secara otomatis
- ✅ **`.sider` / `.kicksider`** — Deteksi & kick member grup yang gak pernah/jarang chat
- ✅ **`.play` Migrasi ke yt-dlp** — `@distube/ytdl-core` sudah di-archive (tidak ada update lagi), menyebabkan error "Status code: 403" terus-menerus. Diganti dengan binary `yt-dlp` (auto-download saat pertama dipakai, lihat bagian "Catatan soal Fitur `.play`" di bawah)
- ✅ **`.iqc` Bubble WhatsApp Asli** — sebelumnya bertema iMessage (biru, ekor kiri), sekarang bubble hijau WhatsApp asli (ekor kanan, teks gelap), plus wrap teks yang lebih natural (tidak lagi 1 kata per baris untuk kalimat pendek)
- ✅ **`.ig` & `.tiktok` (baru)** — download video Instagram/TikTok lewat link langsung ATAU reply ke pesan berisi link, dengan caption info (judul/Request by/Powered by) — memakai infrastruktur yt-dlp yang sama dengan `.play`

---

_Made with ❄️ — GOJO SATORU MD V2 —「Infinity knows no bounds」_


### Admin menu patch
Menu Admin menampilkan command admin tambahan yang benar-benar terdaftar, tanpa placeholder seperti admin143.
