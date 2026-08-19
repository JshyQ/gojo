// ════════════════════════════════════════════════════════════════════
//  SETTING.JS — Konfigurasi Lengkap Bot GOJO SATORU MD V2
//  Edit file ini untuk mengubah seluruh perilaku & tampilan bot.
//  Versi: 2.0.0 — Infinity Edition
// ════════════════════════════════════════════════════════════════════

export const settings = {

    // ╔═══════════════════════════════════════╗
    // ║           IDENTITAS BOT               ║
    // ╚═══════════════════════════════════════╝

    // Nama & nomor Creator. Dulu sengaja disimpan terpisah di lib/roles.js
    // dengan checksum integritas supaya tidak gampang diubah — proteksi itu
    // sudah dilepas per permintaan, jadi sekarang tinggal edit 2 baris di
    // bawah ini lalu restart bot. lib/roles.js otomatis membaca dari sini.
    creatorName:   'Keen',
    creatorNumber: '6285188426365',

    // ID & nama WhatsApp Channel buat branding forward (dipakai di .menu &
    // .allmenu supaya balasan bot terlihat "diteruskan dari" channel ini).
    // Dulu di lib/channelGuard.js dengan checksum integritas — proteksi itu
    // juga sudah dilepas, tinggal edit 2 baris di bawah lalu restart bot.
    channelId:   '120363428989828271@newsletter',
    channelName: 'Gojo Satoru MD V2 Official',

    // Link channel WhatsApp buat tombol "⭐ TESTIMONI" (cta_url) di baris
    // ke-2 .menu — ketuk tombolnya langsung buka link ini. Ganti nilainya
    // kapan saja buat arahkan ke channel lain, tidak perlu bongkar
    // commands/menu.js sama sekali.
    channelUrl:  'https://whatsapp.com/channel/0029VbD6XZW3AzNITBzI7c2L',

    botName:      'GOJO SATORU MD V2',
    botVersion:   '2.0.0',
    botTagline:   '❄️ Infinity Edition — The Strongest Bot',
    prefix:       '.',

    // Nama Owner UTAMA — cuma dipakai untuk TAMPILAN (misal di .owner,
    // .allmenu, dll). Bebas diganti kapan saja, tidak butuh restart bot
    // untuk berlaku.
    ownerName: 'Owner',

    // Nomor Owner UTAMA (format: 628xxx, tanpa "+", "@s.whatsapp.net",
    // atau spasi). Nomor ini OTOMATIS punya akses Owner penuh — beda
    // dengan `ownerName` di atas yang cuma teks tampilan. Cukup ganti
    // nilainya lalu restart bot untuk berlaku.
    ownerNumber: '',

    // Daftar nomor Owner TAMBAHAN (selain `ownerNumber` di atas, dan
    // selain Creator yang sudah otomatis menjadi Owner). Cukup tulis
    // nomor tanpa "+", "@s.whatsapp.net", atau spasi — contoh:
    // '6281234567890'. Edit array ini langsung untuk menambah/menghapus
    // Owner, lalu restart bot.
    // (Owner juga bisa ditambah saat bot berjalan lewat command
    // `.addowner @tag` — boleh dipakai oleh Owner ATAUPUN Creator, dan
    // langsung aktif tanpa restart, beda dengan `ownerNumber`/
    // `ownerNumbers` di sini yang butuh restart bot setelah diedit.)
    ownerNumbers: [
        // '6281234567890',
        // '6289876543210',
    ],

    // Daftar nomor Premium. Sama formatnya seperti ownerNumbers di atas.
    // Owner dan Creator otomatis mendapat akses Premium juga, jadi tidak
    // perlu didaftarkan ulang di sini.
    premiumNumbers: [
        // '6281234567890',
    ],

    // Nomor HP untuk pairing (format: 628xxx tanpa + atau spasi)
    // Bisa juga diisi lewat ENV variable NOMOR_HP di Pterodactyl.
    // Kalau dua-duanya dikosongkan/dibiarkan placeholder ini, bot akan
    // TANYA langsung lewat console saat startup (lihat promptNomorHP()
    // di index.js) — jadi tidak wajib edit file ini kalau mau isi manual.
    nomorPairing: '628xxxxxxxxxx',

    // URL thumbnail Gojo Satoru (tampil di setiap reply bot)
    thumbnailUrl: 'https://files.catbox.moe/8jkhav.png',

    // URL thumbnail khusus command .daftar (registrasi RPG)
    thumbnailDaftar: 'https://files.catbox.moe/ndtp84.png',

    // URL thumbnail khusus .ryoiken/.tenkai (Ryoiki Tenkai). Cuma dipakai
    // sebagai fallback kalau media/ryoiki-tenkai.mp4 belum di-taruh —
    // lihat commands/adminCommands.js -> ryoikiTenkaiKick().
    thumbnailRyoikiTenkai: 'https://files.catbox.moe/cx8bib.png',


    // ╔═══════════════════════════════════════╗
    // ║      PEMBAYARAN & SOSIAL MEDIA        ║
    // ╚═══════════════════════════════════════╝

    // Nomor e-wallet Owner — ditampilkan lewat command .pembayaran.
    // Ganti nomor di bawah sesuai e-wallet kamu sendiri (boleh beda-beda
    // nomor per e-wallet, tidak harus sama semua). Tidak perlu restart bot
    // untuk berlaku — cukup edit lalu simpan.
    nodana:  '085188426365',
    nogopay: '085188426365',
    noovo:   '085188426365',

    // Sosial media Owner — ditampilkan lewat command .sosmedowner.
    ig:   '@kenjikitagawa',
    tele: 'GojoSatoruOFC',
    yt:   'JanpiwWok',


    // ╔═══════════════════════════════════════╗
    // ║   CPANEL — JUALAN SLOT SERVER (v1-v5) ║
    // ╚═══════════════════════════════════════╝
    // Config buat fitur .cpanel (create/list/hapus server Pterodactyl,
    // role Owner/CEO/Reseller, dst — lihat commands/panelCommands.js &
    // lib/pterodactylReseller.js). Isi minimal domain + apikey per server
    // yang mau dipakai; server yang kosong otomatis dianggap nonaktif
    // (muncul sebagai "belum dikonfigurasi" kalau dipanggil).
    //
    //   domain  : URL panel Pterodactyl, contoh 'https://panel.contohmu.com'
    //             (TANPA garis miring "/" di akhir)
    //   apikey  : Application API Key (Admin → Application API di panel).
    //             WAJIB dicentang SEMUA permission saat membuat key ini.
    //   capikey : Client API Key (opsional, cadangan untuk fitur ke depan)
    //   egg     : ID egg yang dipakai buat server baru (Admin → Nests → Eggs)
    //   nestid  : ID nest tempat egg di atas berada
    //   location: ID lokasi/node tujuan deploy (Admin → Locations)
    pterodactyl: {
        server1: { domain: '', apikey: '', capikey: '', egg: '', nestid: '', location: '' },
        server2: { domain: '', apikey: '', capikey: '', egg: '', nestid: '', location: '' },
        server3: { domain: '', apikey: '', capikey: '', egg: '', nestid: '', location: '' },
        server4: { domain: '', apikey: '', capikey: '', egg: '', nestid: '', location: '' },
        server5: { domain: '', apikey: '', capikey: '', egg: '', nestid: '', location: '' },
    },


    // ╔═══════════════════════════════════════╗
    // ║   AI STYLE TRANSFER (.tochibi dkk)    ║
    // ╚═══════════════════════════════════════╝
    // Dipakai fitur .tobotak, .tochibi, .tofigura, .toghibli, .tohijab,
    // .tolego, .tohitam, .to3d, .toroblox, .tooilpainting (lihat
    // commands/mediaCommands3.js & lib/imageStyleTransfer.js).
    //
    // Fitur ini butuh model AI edit-gambar (Gemini image model lewat
    // Puter.js — layanan gratis, TAPI tetap butuh setup akun):
    //   1. Daftar akun gratis di https://puter.com
    //   2. Buka dashboard developer Puter, ambil Auth Token dari sana
    //   3. Isi tokennya di bawah (atau ENV PUTER_AUTH_TOKEN, lebih aman
    //      kalau setting.js ini pernah kamu share ke orang lain)
    //
    // ⚠️ CATATAN JUJUR: paket npm-nya (@heyputer/puter.js) didokumentasikan
    // resmi buat browser, dan dokumentasi txt2img() bilang hasilnya berupa
    // HTMLImageElement (elemen DOM) — yang TIDAK ADA di Node.js server. Ada
    // jalur pemakaian Node.js resmi juga (pola init(token) di bawah), tapi
    // belum bisa dipastikan 100% txt2img() bekerja sama persis di Node
    // tanpa dicoba langsung. Kalau error/hasil gambar rusak, kemungkinan
    // besar ini penyebabnya — lihat catatan penanganan error di
    // lib/imageStyleTransfer.js.
    puterAuthToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InYyIn0.eyJ0IjoidCIsInYiOiIyIiwidG9rZW5fdWlkIjoiOWVhODNjMmEtMThjMi00N2E1LWEzMjYtYWE4OTg0MGMxNTBiIiwidXUiOiJDb0Y4WnVHSlJMMnFJckFHMEdCWWxBPT0iLCJzdSI6InZrM24yeWRJVDF5NlUvWDMxMTl2RGc9PSIsImFpIjoiQ29GOFp1R0pSTDJxSXJBRzBHQllsQT09IiwiZnVsbF9hY2Nlc3MiOnRydWUsImlhdCI6MTc4NDMyNTMxM30.DvCoZtmvImh2grQCjufLfWNNDVGIJ6XYzd1rRGBoxe0',


    // ╔═══════════════════════════════════════╗
    // ║         PERILAKU & FITUR BOT          ║
    // ╚═══════════════════════════════════════╝

    // ── Auto-Read ────────────────────────────────────────────────────
    // Tandai pesan sebagai sudah dibaca (centang biru) sebelum balas
    autoRead:     true,

    // ── Auto-Typing ──────────────────────────────────────────────────
    // Tampilkan indikator "mengetik..." saat memproses command
    autoTyping:   true,
    // v3.1.2: rentang delay "mengetik" sebelum bot membalas (ms) — dibuat
    // acak di antara min–max (bukan angka tetap) biar terkesan lebih
    // manusiawi. Diatur ke 3-4 detik sesuai permintaan.
    // FIX PERFORMA (2026-07-24): 3-4 detik di atas adalah PENYEBAB UTAMA
    // keluhan "bot delay banget" — itu jeda YANG DISENGAJA sebelum command
    // apapun mulai diproses, bukan bug. Diturunkan ke rentang 250-500ms
    // (masih ada sedikit efek "mengetik...", tapi sudah nyaris instan).
    // Untuk BENAR-BENAR instan (skip indikator mengetik sepenuhnya, tanpa
    // restart bot), Owner/Creator/Admin grup tinggal kirim: .delay 0
    // (lihat lib/replyDelay.js + handler .delay di commands/index.js —
    // fitur ini sudah ada, cuma belum di-set). ".delay default" kembali
    // ke rentang di bawah ini kapan saja.
    typingDurationMin: 250,
    typingDurationMax: 500,

    // ── Online Status ─────────────────────────────────────────────────
    // true  = bot terlihat Online (bisa menguras baterai HP)
    // false = bot diam-diam berjalan (direkomendasikan)
    markOnlineOnConnect: false,

    // ── Notifikasi "Bot Terhubung" ──────────────────────────────────────
    // true = begitu pairing BARU berhasil (bukan reconnect biasa), bot
    // kirim 1x pesan konfirmasi ke nomor bot sendiri (self-chat) — jadi
    // ada bukti di WA, bukan cuma di console. Set false kalau tidak mau
    // pesan ini sama sekali.
    notifyOnConnect: true,

    // ── Self-Bot Mode ─────────────────────────────────────────────────
    // Jika true, bot HANYA merespons pesan dari owner sendiri
    selfMode: false,

    // ── Footer Pesan ──────────────────────────────────────────────────
    // Teks yang muncul di bawah setiap reply (kosongkan jika tidak mau)
    replyFooter: '',


    // ╔═══════════════════════════════════════╗
    // ║         SISTEM COOLDOWN               ║
    // ╚═══════════════════════════════════════╝

    // Aktifkan sistem cooldown per user per command
    cooldownEnabled: true,
    // Jeda default antar command yang sama (ms) — 3 detik
    defaultCooldown: 3000,
    // Override per kategori (ms)
    cooldowns: {
        rpg:   8000,   // Command RPG (hunt, boss, dungeon, dll) — 8 detik
        admin: 2000,   // Command admin grup
        fun:   3000,   // Fun & game
        tools: 1500,   // Tools & kalkulator
        menu:   500,   // Menu & info
    },
    // Owner bypass cooldown
    ownerBypassCooldown: true,


    // ╔═══════════════════════════════════════╗
    // ║       RECONNECT & KONEKSI             ║
    // ╚═══════════════════════════════════════╝

    // Jeda awal sebelum reconnect pertama (detik)
    reconnectDelay: 5,
    // Delay eksponensial: setiap gagal, delay × faktor ini (max reconnectDelayMax)
    reconnectBackoffFactor: 1.5,
    // Delay maksimum reconnect (detik)
    reconnectDelayMax: 60,
    // 0 = coba reconnect selamanya
    maxReconnectAttempts: 0,

    // Seberapa sering folder session/ di-backup otomatis ke session-backup/
    // (menit). Backup hanya terjadi setelah koneksi berhasil terbuka, dan
    // hanya kalau session/ dalam keadaan valid (ada creds.json) — lihat
    // backupSession() di index.js untuk detail lengkap kenapa ini membantu
    // mengatasi masalah "session sering rusak" (badSession).
    sessionBackupIntervalMinutes: 30,


    // ╔═══════════════════════════════════════╗
    // ║         PROTEKSI GRUP                 ║
    // ╚═══════════════════════════════════════╝

    // Jumlah pesan maks dalam satu window sebelum dianggap spam
    spamMaxMessages: 6,
    // Durasi window spam (ms)
    spamWindowMs: 10_000,
    // Jumlah warn sebelum auto-kick (per default, bisa diubah per grup)
    defaultWarnLimit: 3,

    // ── Kata Toxic Default ────────────────────────────────────────────
    // Daftar kata yang diblokir anti-toxic (selain hardcoded)
    // Tambah kata-kata lain di sini sesuai kebutuhan grupmu
    extraToxicWords: [],

    // ── Anti-NSFW (v3.2.0) ────────────────────────────────────────────
    // Dipakai fitur .antinsfw on/off (lihat features/antiNsfw.js &
    // lib/nsfwDetector.js) — deteksi & hapus otomatis foto/video/stiker
    // dewasa yang masuk ke grup.
    //
    // Command manual `.hapusnsfw` (reply lalu hapus paksa) SELALU jalan
    // tanpa butuh apa pun di bawah ini. Tapi deteksi OTOMATIS (`.antinsfw
    // on`) baru bisa menghapus dengan sendirinya kalau apiKey sudah diisi:
    //   1. Daftar akun gratis di https://console.pixlab.io
    //   2. Ambil API key dari dashboard
    //   3. Isi di bawah (atau ENV NSFW_API_KEY, lebih aman kalau setting.js
    //      ini pernah kamu bagikan ke orang lain)
    //
    // ⚠️ CATATAN JUJUR: ini API pihak ketiga gratis (PixLab) — sudah
    // diverifikasi dokumentasinya resmi ada (https://pixlab.io/endpoints/nsfw),
    // tapi seperti API gratis pada umumnya, kuota/ketentuan bisa berubah
    // sewaktu-waktu. Kalau suatu saat ingin pindah ke provider lain, isi
    // `customApiUrl` di bawah (kontraknya ada di komentar
    // lib/nsfwDetector.js) — TIDAK perlu bongkar features/antiNsfw.js.
    // Selama apiKey/customApiUrl masih kosong, `.antinsfw on` tetap bisa
    // dinyalakan tanpa error, hanya saja deteksi otomatisnya belum aktif
    // (fail-open, lihat lib/nsfwDetector.js untuk detail lengkap).
    nsfwDetection: {
        apiKey:       '',        // API key PixLab (kosongkan kalau pakai customApiUrl)
        customApiUrl: '',        // opsional: URL API kompatibel lain (lihat kontrak di lib/nsfwDetector.js)
        threshold:    0.6,       // 0.0–1.0 — makin kecil makin sensitif/gampang kena hapus
        timeoutMs:    15000,     // batas waktu tunggu API sebelum dianggap gagal (fail-open)
    },


    // ╔═══════════════════════════════════════╗
    // ║             LOGGING                   ║
    // ╚═══════════════════════════════════════╝

    // Tampilkan log setiap pesan masuk di console
    logMessages:  true,
    // Tampilkan log setiap command dijalankan
    logCommands:  true,
    // Log level Baileys — 'silent' hampir selalu yang terbaik untuk prod
    baileysLogLevel: 'silent',

};

export default settings;
