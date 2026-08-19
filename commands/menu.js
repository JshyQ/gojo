import settings from '../setting.js';
import { fmtDuration, safeReplyText, truncate, withTimeout } from '../lib/utils.js';
import { resolveFfmpegPath } from '../lib/videoGen.js';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getChar } from '../lib/rpgEngine.js';
import { expNeeded } from '../lib/rpgData.js';
import { log } from '../lib/logger.js';
import { markMenuPending } from '../lib/menuShortcut.js';
import { getGroupMetadata } from '../lib/groupMetaCache.js';
import { getThumbnailImageContent } from '../lib/thumbnailSource.js';
import { mapChars, SMALLCAPS_MAP } from './toolsCommands11.js';
import { GOJO_2000_FEATURES } from './featureRegistry2000.js';

// FIX "font beda dari contoh": label section .menu sebelumnya pakai gaya
// unicode Bold-Italic Sans (𝙉𝙖𝙢𝙖, 𝑵𝑶𝑻𝑬, dst) — beda gaya sama contoh
// referensi yang dikasih user (gaya small-caps, mis. "ʙᴏᴛ ɪɴғᴏ"). sc()
// pakai SMALLCAPS_MAP yang SAMA persis dengan command .smallcaps yang
// sudah ada, supaya gaya font di .menu konsisten dengan tool bawaan bot.
// Diekspor (bukan cuma dipakai internal) supaya .allmenu di commands/index.js
// bisa pakai helper font yang SAMA — biar font section header di .allmenu
// konsisten dengan .menu, .menurpg, .menuadmin, dst (semua satu sumber).
export const sc = (text) => mapChars(text.toLowerCase(), SMALLCAPS_MAP);

const P   = settings.prefix   || '.';
const BOT = settings.botName  || 'GOJO SATORU MD V2';
const TAG = settings.botTagline || '❄️ Infinity Edition';


// Registry category helper: menu kategori tidak lagi hanya menampilkan daftar
// statis. Semua command dari registry 2.000 yang memang masuk kategori akan
// ikut ditampilkan dengan deskripsi. Pengiriman dipecah agar tidak mentok
// batas panjang pesan WhatsApp.
const REGISTRY_CATEGORY_RANGES = {
    '⚔️ RPG': [[9,44],[223,244],[295,302],[350,395],[510,517]],
    '🛡️ Admin': [[45,147],[245,270],[303,314],[396,404],[690,764]],
    '🎮 Fun': [[148,173],[315,329],[405,424],[475,510]],
    '🛠️ Tools': [[174,198],[329,349],[425,474],[517,599],[628,633],[651,690]],
    '🖼️ Media': [[291,294],[600,627],[634,650]],
    '🤖 Bot': [[199,222],[611,618],[691,717],[767,769]],
    '📥 Downloader': [[770,783]],
};

const REGISTRY_CATEGORY_PREFIX = {
    rpg: '⚔️ RPG', admin: '🛡️ Admin', fun: '🎮 Fun', tool: '🛠️ Tools',
    media: '🖼️ Media', bot: '🤖 Bot', social: '📥 Downloader',
};

function registryCategory(name) {
    const n = String(name || '').toLowerCase();
    const prefix = Object.keys(REGISTRY_CATEGORY_PREFIX).find(p => n.startsWith(p));
    if (prefix) return REGISTRY_CATEGORY_PREFIX[prefix];
    if (['sewa','ceksewa','delsewa','listsewa','extsewa','hargasewa','gantihargasewa','sewamode'].includes(n)) return '🛒 Sewa';
    if (['brat','bratgreen','bratwhite','iqc','repost'].includes(n)) return '🖼️ Media';
    if (['self','public','private','autojoin','whoami','runtime','jam'].includes(n)) return '🤖 Bot';
    if (['menu','menurpg','menuadmin','menufun','menutools','menumedia','menubot','totalfitur','daftar'].includes(n)) return '🤖 Bot';
    const i = GOJO_2000_FEATURES.indexOf(n);
    for (const [cat, blocks] of Object.entries(REGISTRY_CATEGORY_RANGES)) {
        if (blocks.some(([a,b]) => i >= a && i <= b)) return cat;
    }
    if (n === 'play') return '🎵 Music';
    if (['broadcast','broadcastuser','listgrup'].includes(n)) return '📢 Broadcast';
    if (n === 'cpanel') return '🖥️ Panel';
    if (['sewa','ceksewa','delsewa','listsewa','extsewa','hargasewa','gantihargasewa','sewamode'].includes(n)) return '🛒 Sewa';
    return '📦 Lainnya';
}

function compactMenuDescription(name) {
    const text = getFeatureDescription(name);
    if (text.length <= 34) return text;
    return text.slice(0, 34).replace(/[ ,.;:!?-]+$/,'') + '…';
}

const CURATED_MENU_COMMANDS = new Set([
    'achievement',
    'add',
    'addannouncement',
    'addbadword',
    'addjadwal',
    'addmembernote',
    'addnote',
    'addowner',
    'addprem',
    'admincount',
    'afirmasihariini',
    'aktivitasgrup',
    'allmenu',
    'allowlinkadd',
    'allowlinkdel',
    'allowlinklist',
    'alternating',
    'anagram',
    'angkakeberuntungan',
    'anticaps',
    'antidelete',
    'antigb',
    'antijudol',
    'antilink',
    'antilinkall',
    'antilinkphising',
    'antinsfw',
    'antipinjol',
    'antishortlink',
    'antispam',
    'antitag',
    'antitoxic',
    'antivirtex',
    'approveall',
    'approverequest',
    'asciitext',
    'assigntask',
    'atbash',
    'aturautobalas',
    'autoreply',
    'average',
    'averagespeed',
    'backupnow',
    'backupsetting',
    'ban',
    'banlist',
    'beli',
    'binaryops',
    'blokirpengguna',
    'bmi',
    'bmidetail',
    'bmr',
    'boss',
    'bossinfo',
    'botstats',
    'bounty',
    'brat',
    'brighten',
    'broadcast',
    'broadcastuser',
    'buatpolling',
    'bukablokirpengguna',
    'bulkdemote',
    'bulkkick',
    'bulkpromote',
    'businessdays',
    'buypet',
    'caesardekrip',
    'caesarenkrip',
    'calc',
    'camelcase',
    'canceljadwalgrup',
    'cekaturangrup',
    'cekbot',
    'cekcc',
    'cekemail',
    'cekjabatan',
    'cekjadwalgrup',
    'ceknohp',
    'cekpalindrom',
    'cekpassword',
    'cekprima',
    'cekwarnall',
    'changelog',
    'checkwarn',
    'circlearea',
    'claimbounty',
    'class',
    'clearlaporan',
    'coinflip',
    'compliment',
    'compoundinterest',
    'convertlength',
    'convertweight',
    'cook',
    'cpanel',
    'craft',
    'createevent',
    'credits',
    'currencyformat',
    'dadjoke',
    'daily',
    'dare',
    'delannouncement',
    'delay',
    'delbadword',
    'deljadwal',
    'delmembernote',
    'delnote',
    'delowner',
    'delprem',
    'deltemplate',
    'demote',
    'dice',
    'digitalroot',
    'diskon',
    'divorce',
    'dogyears',
    'donetask',
    'drawcard',
    'dungeon',
    'dungeoninfo',
    'emojirandom',
    'ephemeral',
    'equip',
    'equiptitle',
    'eventattendees',
    'expedition',
    'exportmember',
    'extractaudio',
    'extractnumbers',
    'fact',
    'faktorial',
    'farewell',
    'farmstatus',
    'fibonacci',
    'fish',
    'flipvertical',
    'fortunecookie',
    'frekuensikata',
    'frombase64',
    'frombinary',
    'fromhex',
    'frommorse',
    'fueleff',
    'gacha',
    'gcdlcm',
    'genpassword',
    'genuuid',
    'gojo',
    'gojoai',
    'gojofact',
    'gojohype',
    'gojopower',
    'gojoroast',
    'gojoteknik',
    'gpacalc',
    'grayscale',
    'groupage',
    'groupcreator',
    'groupinfo',
    'grouplinkqr',
    'grouplockstatus',
    'groupsummary',
    'guesshilo',
    'guildcreate',
    'guilddisband',
    'guilddonate',
    'guildinfo',
    'guildjoin',
    'guildkick',
    'guildleave',
    'guildlist',
    'guildmembers',
    'guildpromote',
    'guildupgrade',
    'hammingdistance',
    'hapusicon',
    'hapuspengumuman',
    'hapusvokal',
    'harike',
    'harvest',
    'hashtaggen',
    'hasilpoll',
    'hd',
    'helpproteksi',
    'hex2rgb',
    'hidetag',
    'hitungkonsonan',
    'hitungtip',
    'hitungvokal',
    'hunt',
    'ibancheck',
    'ig',
    'inventory',
    'iqc',
    'istirahat',
    'jadibot',
    'jadwalbuka',
    'jadwaltutup',
    'jam',
    'jawabriddle2',
    'jawabscramble',
    'jawabtrivia',
    'joblist',
    'jodoh',
    'jsonvalidate',
    'jual',
    'katahariini',
    'kebabcase',
    'kepribadianhariini',
    'kerja',
    'kick',
    'kickall',
    'kicksider',
    'klaimekspedisi',
    'konspirasi',
    'kuadrat',
    'lapor',
    'lawan',
    'leaderboard',
    'leapyear',
    'leapyearlist',
    'leave',
    'leet',
    'levenshtein',
    'lihatautobalas',
    'lihatcatatan',
    'link',
    'listadmin',
    'listannouncement',
    'listautoreply',
    'listbadword',
    'listbirthday',
    'listevents',
    'listgrup',
    'listinactive',
    'listjadibot',
    'listjadwal',
    'listlaporan',
    'listmembernote',
    'listmutedmember',
    'listowner',
    'listpoll',
    'listprem',
    'listrequest',
    'listsuggestions',
    'listtasks',
    'listtemplate',
    'listunique',
    'loadtemplate',
    'lockaudio',
    'lockcontact',
    'lockdocument',
    'lockgif',
    'lockgroup',
    'lockimage',
    'lockinfo',
    'locklocation',
    'lockmedia',
    'lockpoll',
    'lockstiker',
    'locktext',
    'lockvideo',
    'lockvn',
    'loremipsum',
    'lovecalc',
    'lower',
    'magic8ball',
    'maintenancemode',
    'marry',
    'massconvert',
    'mbtitoday',
    'mediainfo',
    'median',
    'membercount',
    'menuadmin',
    'menubot',
    'menumedia',
    'menurpg',
    'menutools',
    'mine',
    'moodku',
    'motd',
    'mute',
    'mutemember',
    'mutestatus',
    'mutevideo',
    'mytasks',
    'nabung',
    'ncr',
    'nextweekday',
    'nomorhoki',
    'notes',
    'numeronim',
    'owner',
    'pantun',
    'pembayaran',
    'pembukacerita',
    'pengagumrahasia',
    'pengumuman',
    'pernahkah',
    'persen',
    'persenubah',
    'petinfo',
    'petshop',
    'pilih',
    'pilihini',
    'ping',
    'pingenerate',
    'plant',
    'play',
    'poll',
    'pollclose',
    'pollnative',
    'pp',
    'ppgrup',
    'pressureconvert',
    'prestige',
    'previewwelcome',
    'profil',
    'promote',
    'pujianrandom2',
    'qrcode',
    'quest',
    'questclaim',
    'quicklock',
    'quickunlock',
    'quote',
    'railfence',
    'randomcolorname',
    'randomname',
    'randomword',
    'ranking',
    'ratehariini',
    'rayuan',
    'readingtime',
    'recipes',
    'refine',
    'regextest',
    'rejectall',
    'rejectrequest',
    'removedupewords',
    'removepunctuation',
    'repost',
    'resetprotection',
    'resetwarnall',
    'restoresetting',
    'retirement',
    'reverse',
    'reversevideo',
    'revoke',
    'riddle',
    'riddle2',
    'roast',
    'rob',
    'rolldadu',
    'rollnotation',
    'roman',
    'rot13',
    'rot47',
    'rotate90',
    'rpg',
    'rps',
    'rsvp',
    'rules',
    'runtime',
    'savetemplate',
    'sepia',
    'setbirthday',
    'setdesc',
    'setfarewell',
    'seticon',
    'setmotd',
    'setname',
    'setpengumuman',
    'setpet',
    'setrules',
    'setwelcome',
    'sewa',
    'shorturl',
    'shuffle',
    'sider',
    'simpancatatan',
    'simplifyfraction',
    'sisahari',
    'slot',
    'slowmode',
    'slowmodeoff',
    'slugify',
    'snakecase',
    'sosmedowner',
    'speedup',
    'splitbill',
    'statdetail',
    'statistikgrup',
    'statsgrupmember',
    'stdev',
    'sticker',
    'stopbot',
    'strikethrough',
    'suggest',
    'suhu',
    'suhulengkap',
    'support',
    'syllable',
    'tagall',
    'tanggalrandom',
    'tantanganrandom',
    'tarik',
    'tarot',
    'tax',
    'tebak',
    'tebakangka',
    'tebakgambar',
    'tebakhilo',
    'textascii',
    'threads',
    'tiktok',
    'timeconvert',
    'titlecase',
    'titles',
    'tobase32',
    'tobase36',
    'tobase58',
    'tobase64',
    'tobinary',
    'tobotak',
    'tohex',
    'tohijab',
    'toko',
    'tomorse',
    'topactive',
    'topwarn',
    'topwords',
    'toroblox',
    'totalfitur',
    'train',
    'transfer',
    'trapezoidarea',
    'trimspaces',
    'trivia',
    'truth',
    'ulangteks',
    'umur',
    'unban',
    'unbanall',
    'unlockgroup',
    'unlockinfo',
    'unmute',
    'unmutemember',
    'unwarn',
    'upper',
    'upsidedown',
    'urlencode',
    'use',
    'version',
    'vigenere',
    'volumeup',
    'vote',
    'votekick',
    'warn',
    'warnall',
    'warnarandom',
    'warnlimit',
    'water',
    'watermark',
    'welcome',
    'whitelist',
    'whitelistadd',
    'whitelistdel',
    'whoami',
    'windchill',
    'wordcount',
    'wordscramble',
    'wyr',
    'zodiak',
    'zodiaklahir',
    'opengroup',
    'closegroup',
    'terimarequest',
    'tolakrequest',
    'terimasemua',
]);


function registrySubcategory(name, category) {
    const n = String(name || '').toLowerCase();

    if (category === '🛡️ Admin') {
        if (/(approve|reject|request|terima|tolak)/.test(n)) return '📥 Approval & Join Request';
        if (/(kick|promote|demote|add|remove|member|mutemember|unmutemember|listadmin|admincount|bulk)/.test(n)) return '👥 Manajemen Member';
        if (/(owner|creator|premium|role|jabatan|permission|access)/.test(n)) return '👑 Jabatan & Hak Akses';
        if (/(warn|warning|strike)/.test(n)) return '⚠️ Warning & Moderasi';
        if (/(lockimage|lockvideo|lockdocument|lockcontact|locklocation|lockvn|lockaudio|lockgif|lockpoll|locktext|locksticker|lockmedia)/.test(n)) return '🔒 Lock Konten';
        if (/(anti|protect|secure|phishing|nsfw|spam|toxic|virtex|judol|pinjol|caps|flood)/.test(n)) return '🛡️ Proteksi';
        if (/(badword|allowlink|whitelist|antilink|link|revoke)/.test(n)) return '🔗 Link, Kata & Whitelist';
        if (/(welcome|farewell)/.test(n)) return '👋 Welcome & Farewell';
        if (/(poll|vote|jadwal|schedule)/.test(n)) return '📊 Poll & Jadwal';
        if (/(event|rsvp|birthday|task|quicklock|quickunlock)/.test(n)) return '🎉 Event & Tugas';
        if (/(announcement|pengumuman|membernote|template|catatan|note|motd|autoreply)/.test(n)) return '📝 Pengumuman, Catatan & Template';
        if (/(audit|report|lapor|laporan)/.test(n)) return '🧾 Audit & Laporan';
        if (/(monitor|activity|aktivitas|stats|statistik)/.test(n)) return '📈 Monitoring & Statistik';
        if (/(backup|restore)/.test(n)) return '💾 Backup & Restore';
        if (/(group|open|close|setname|setdesc|icon|ephemeral|rules|setting)/.test(n)) return '⚙️ Pengaturan Grup';
        if (/(summary|groupage|exportmember|cekbot)/.test(n)) return '📋 Dashboard Grup';
        return '📦 Admin Lainnya';
    }

    if (category === '⚔️ RPG') {
        if (/(quest|mission)/.test(n)) return '📜 Quest & Misi';
        if (/(boss|raid|hunt|lawan|attack|defend|dodge|battle|duel)/.test(n)) return '⚔️ Pertarungan';
        if (/explore/.test(n)) return '🗺️ Eksplorasi';
        if (/scout/.test(n)) return '🔭 Scout & Penjelajahan';
        if (/survive/.test(n)) return '🛡️ Survival';
        if (/treasure|loot|chest/.test(n)) return '💎 Harta & Loot';
        if (/fish/.test(n)) return '🎣 Memancing';
        if (/mine/.test(n)) return '⛏️ Mining';
        if (/(craft|refine|forge|upgrade)/.test(n)) return '🔨 Crafting & Upgrade';
        if (/(farm|plant|water|harvest)/.test(n)) return '🌾 Berkebun';
        if (/(cook|recipe)/.test(n)) return '🍳 Memasak';
        if (/(pet|buypet)/.test(n)) return '🐾 Pet System';
        if (/(guild|clan)/.test(n)) return '🏰 Guild & Clan';
        if (/(class|profil|stat|inventory|equip|unequip|use|heal|revive|train)/.test(n)) return '👤 Karakter & Perlengkapan';
        if (/(shop|toko|buy|sell|daily|job|kerja|bank|nabung|tarik|transfer|rob|economy|gold)/.test(n)) return '💰 Ekonomi & Toko';
        if (/(ranking|leaderboard|marry|divorce)/.test(n)) return '🏆 Ranking & Sosial';
        return '⚔️ RPG Lainnya';
    }

    if (category === '🛠️ Tools') {
        if (/(binary|base|hex|morse|rot|caesar|vigenere|atbash|cipher|encode|decode|ascii|urlencode|urldecode|htmlencode|htmldecode)/.test(n)) return '🔐 Encoding & Kriptografi';
        if (/(calc|persen|bmi|prima|faktorial|fibonacci|gcd|lcm|average|median|mode|fraction|interest|loan|roi|tax|discount|gpa|roman|number|area|volume|convert.*(length|weight|temperature|suhu|mass|volume|pressure|angle|currency))/.test(n)) return '🔢 Matematika & Konversi';
        if (/(uppercase|lower|upper|reverse|alternating|titlecase|camelcase|snakecase|kebabcase|leet|wordcount|vokal|konsonan|ulangteks|frekuensi|slugify|anagram|syllable|readingtime|smallcaps|upsidedown|zalgo|strikethrough|underline|circledtext|fullwidth|textanalysis|capitalize|trimspaces|countchar|removedupewords|strlen|reversenumber)/.test(n)) return '🔤 Manipulasi Teks';
        if (/(email|nohp|cc|password|palindrom|palindrome|iban|macvalidate|ipv4|regex|jsonvalidate|isnumeric)/.test(n)) return '✅ Validator & Pemeriksa';
        if (/(genpassword|uuid|pilih|shuffle|random|coupon|pingenerate|drawcard|hashtag|numbertowords|numeronim|passphrase|acronym)/.test(n)) return '🎲 Generator & Random';
        if (/(hari|tanggal|date|year|umur|age|weekday|weeknumber|quarter|businessdays|zodiak|timeconvert|ageinseconds|sisahari|daysinmonth)/.test(n)) return '📅 Tanggal & Waktu';
        if (/(diskon|bill|tip|currency|retirement|bmr|idealweight|waterintake|fueleff|cookingconvert|electricitybill)/.test(n)) return '💸 Keuangan & Kalkulator';
        if (/(qrcode|shorturl|url|html|json|regex|extractemails|extracturls)/.test(n)) return '🌐 Web, URL & Data';
        return '🛠️ Tools Lainnya';
    }

    if (category === '🖼️ Media') {
        if (/(sticker|stiker|brat|iqc)/.test(n)) return '🎭 Stiker & Teks';
        if (/(hd|grayscale|mirror|blur|rotate|sepia|invert|pixelate|brighten|darken|flip|square|watermark)/.test(n)) return '🎨 Efek & Edit Gambar';
        if (/(speed|slowmo|mutevideo|reversevideo|extractaudio|volumeup)/.test(n)) return '🎬 Edit Video & Audio';
        if (/(pp|profile|avatar)/.test(n)) return '👤 Profil & Foto';
        if (/(repost|mediainfo)/.test(n)) return '🔁 Repost & Info Media';
        return '🖼️ Media Lainnya';
    }

    if (category === '🎮 Fun') {
        if (/(trivia|riddle|tebak|guess|scramble|rps|dice|coin|slot|magic8|tarot)/.test(n)) return '🎲 Mini Game';
        if (/(jodoh|love|wyr|zodiak|mood|pengagum|rayuan|pernahkah)/.test(n)) return '💕 Sosial & Fun';
        if (/(quote|fact|pantun|kata|afirmasi|wejangan)/.test(n)) return '💬 Quote & Random';
        if (/gojo/.test(n)) return '💙 Gojo Special';
        if (/(roast|compliment|pujian|tantangan|dare|truth)/.test(n)) return '🎭 Interaksi';
        return '🎮 Fun Lainnya';
    }

    if (category === '🤖 Bot') {
        if (/(menu|totalfitur|daftar|version|runtime|ping|whoami)/.test(n)) return 'ℹ️ Info & Status';
        if (/(self|public|private|autojoin|autoread|autotyping)/.test(n)) return '⚙️ Mode & Otomatisasi';
        if (/(jadibot|stopbot|listjadibot)/.test(n)) return '🤖 Multi Bot';
        if (/(stats|system|database|session)/.test(n)) return '📊 Sistem & Statistik';
        return '🤖 Bot Lainnya';
    }

    if (category === '🎵 Music') return '🎵 Musik & YouTube';
    if (category === '📥 Downloader') {
        if (/(ig|instagram|tiktok|twitter|facebook|threads|reddit|bilibili|dailymotion|vimeo|snackvideo|pinterest)/.test(n)) return '📱 Sosial Media';
        if (/(yt|youtube|play)/.test(n)) return '🎵 YouTube & Musik';
        return '📥 Downloader Lainnya';
    }
    if (category === '📢 Broadcast') return '📢 Broadcast';
    if (category === '🖥️ Panel') {
        if (/(create|make|add)/.test(n)) return '🖥️ Buat Server';
        if (/(delete|del|remove)/.test(n)) return '🗑️ Hapus & Kelola Server';
        if (/(role|admin|seller)/.test(n)) return '👥 Role & Akses';
        return '⚙️ Panel & Server';
    }
    if (category === '🌀 Gojo') return '💙 Gojo AI & Special';
    if (category === '🛒 Sewa') return '🛒 Sewa Bot';
    if (category === '💎 Premium') return '💎 Premium';
    return '📦 Lainnya';
}

function buildRegistryCategoryPack(category, label = category) {
    const names = GOJO_2000_FEATURES
        .filter(n => registryCategory(n) === category)
        .filter(n => !['gamble','lottery','bettinggold'].includes(String(n).toLowerCase()))
        .filter(n => !CURATED_MENU_COMMANDS.has(String(n).toLowerCase()));
    if (!names.length) return '';

    const groups = new Map();
    for (const name of names) {
        const sub = registrySubcategory(name, category);
        if (!groups.has(sub)) groups.set(sub, []);
        groups.get(sub).push(name);
    }

    const blocks = [...groups.entries()].map(([sub, list]) => {
        const lines = list.sort().map(name => `│ ${P}${name} — ${compactMenuDescription(name)}`);
        return `\n╭─〔 ${sub} 〕\n${lines.join('\n')}\n╰──────────────────────────────`;
    }).join('\n');

    return `\n${blocks}`;
}

// ─── MENU UTAMA (RINGKAS) ─────────────────────────────────────────
// Sengaja dibuat singkat — info lengkap (proteksi aktif & daftar semua
// command) dipindahkan ke .allmenu, supaya .menu cepat dibaca sekilas.
// Struktur info (Nama/Status/Uptime/Respon/Versi/Mode/Prefix) terinspirasi
// dari format menu bot lain yang dicontohkan user, disesuaikan ke identitas
// GOJO SATORU MD V2.
// FIX (rebranding V2): tambah sapaan + perkenalan singkat di baris paling
// awal menuText (sebelum box header) sesuai permintaan user — dirender di
// KEDUA jalur (interactive button & fallback text) karena keduanya pakai
// variabel menuText yang sama, jadi cukup diubah di satu tempat ini.
export async function sendMainMenu(reply, sender, sock, jid, msg, opts = {}) {
    const now     = Date.now();
    const { isOwner = false, isPremium = false, pushName = null, botStartTime = now, totalFeatures = 0, featureList = [] } = opts;

    let latensi = 0;
    if (sock && jid) {
        const t0 = Date.now();
        try { await sock.sendPresenceUpdate('composing', jid); } catch { /* abaikan */ }
        latensi = Date.now() - t0;
    }

    const statusLabel = isOwner ? 'Owner 👑' : isPremium ? 'Premium 💎' : 'Free 🌿';
    const namaTampil  = pushName || (sender ? sender.split('@')[0] : 'Kakak');

    // Data tambahan buat header premium (v3.2.2) — semuanya baca dari
    // variabel/API yang sudah ada (settings, process bawaan Node.js),
    // tidak ada state/logic baru yang ditambahkan.
    const mode        = settings.public !== false ? 'Public' : 'Private';
    const nodeVersion = process.version;
    const ramUsageMb  = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    const char = sender ? getChar(sender) : null;
    const userLines = char
        ? `┃ ⟤ 🗡️ ${sc('Kelas')}   : ${char.class}\n┃ ⟤ ✨ ${sc('Level')}   : ${char.level} _(exp ${char.exp}/${expNeeded(char.level)})_\n┃ ⟤ 💰 ${sc('Gold')}    : ${char.gold}`
        : `┃ ⟤ 💡 Ketik *${P}rpg* buat mulai petualangan`;

    const menuText =
`👋 Halo, *${namaTampil}*! Kenalin, aku *${BOT}* ❄️ — bot WhatsApp serba bisa yang siap bantu kamu kapan aja. Yuk cek menu lengkapnya di bawah ini~
_${TAG}_

┏ 👤 ${sc('User')}     : ${namaTampil}
┃ 👑 ${sc('Status')}   : ${statusLabel}
┗ ⚡ ${sc('Mode')}     : ${mode}

┏ 📦 ${sc('Version')}  : v${settings.botVersion || '2.0.0'}
┃ 🟢 ${sc('Node.js')}  : ${nodeVersion}
┗ 📚 ${sc('Library')}  : Baileys

┏ 💾 ${sc('RAM')}      : ${ramUsageMb} MB
┃ ⏰ ${sc('Runtime')}  : ${fmtDuration(now - botStartTime)}
┃ 📊 ${sc('Feature')}  : ${totalFeatures}
┗ 🔖 ${sc('Prefix')}   : ${P}

${sc('Fast')} • ${sc('Stable')} • ${sc('Premium')}
⭐ ${sc('READY PANEL')} • ${sc('LEGAL')}
🌐 zanspiwptero.shoppanel.my.id

${userLines}

╭─〔 📋 ${sc('Menu Cepat')} 〕
│ ❍ *1* — 🤖 All Menu
│ ❍ *2* — 👑 Owner
│ ❍ *3* — 💎 Premium
│ ❍ *4* — 📢 Channel
│ ❍ *5* — 🛒 Sewa Bot
│ ❍ *6* — 💰 Buy Panel
│ ❍ *7* — 📜 Rules
│ ❍ *8* — 📞 Contact
│ ❍ *9* — ⚡ Ping
╰────────────
_Balas salah satu angka di atas, atau ketik command-nya langsung._

╭─〔 📖 ${sc('Keterangan')} 〕
│ ❍ 🌟 ${sc('Creator')}   ❍ Ⓞ ${sc('Owner')}
│ ❍ Ⓐ ${sc('Admin')}     ❍ Ⓟ ${sc('Premium')}
│ ❍ _Tanpa simbol = Free_
╰────────────`;


    // .menu utama sengaja TIDAK menumpahkan 2.000 command ke satu pesan.
    // Daftar lengkap tetap ada di .allmenu; .menu hanya menampilkan ringkasan
    // kategori supaya ringan dibaca dan tidak membuat chat seperti screenshot
    // lama yang penuh placeholder.
    const featureCounts = {};
    for (const name of featureList) {
        const n = String(name).toLowerCase();
        const cat =
            n.startsWith('rpg') ? '⚔️ RPG' :
            n.startsWith('admin') ? '🛡️ Admin' :
            n.startsWith('fun') ? '🎮 Fun' :
            n.startsWith('tool') ? '🛠️ Tools' :
            n.startsWith('media') ? '🖼️ Media' :
            n.startsWith('bot') ? '🤖 Bot' : '📦 Lainnya';
        featureCounts[cat] = (featureCounts[cat] || 0) + 1;
    }
    const featureSummary = Object.entries(featureCounts)
        .map(([cat, count]) => `│ ❍ ${cat} : *${count} fitur*`)
        .join('\n');

    const completeMenuText = menuText + `

╭─〔 📚 ${sc('Feature Pack')} • ${featureList.length} 〕
${featureSummary}
│
│ ${P}allmenu — lihat daftar 2.000 fitur lengkap
│ ${P}menurpg — menu RPG
│ ${P}menuadmin — menu Admin
╰────────────`;
    // FIX (percobaan ke-12 — dikonfirmasi lewat dokumentasi Baileys +
    // laporan bug serupa persis di GitHub resminya: "sendMessage() akan
    // mengambil daftar participant grup dulu untuk enkripsi ke tiap
    // anggota" sebelum benar-benar mengirim; relayMessage() dipanggil
    // langsung TIDAK melakukan ini otomatis). Percobaan ke-11 (ganti ke
    // shape { text, buttons, footer } yang "dikenal" sock.sendMessage())
    // memang jadi bisa terkirim & KEBUKTI didekripsi normal — TAPI
    // nativeFlowInfo custom di button ke-2 hilang di tengah jalan (proses
    // konstruksi internal Baileys utk shape ini kemungkinan cuma menyalin
    // field yang dikenalnya per button, bukan copy-paste objek apa
    // adanya) — makanya tombol interaktifnya tidak muncul lagi.
    // Sekarang: BALIK ke struktur proto mentah (generateWAMessageFromContent
    // + relayMessage) yang SUDAH TERBUKTI render tombol interaktif dengan
    // benar sejak awal — tapi sebelum relayMessage dipanggil, metadata
    // grup di-pastikan fresh dulu lewat getGroupMetadata() (helper yang
    // SUDAH ADA di lib/groupMetaCache.js, dipakai index.js juga) — supaya
    // bagian yang selama ini hilang dari jalur relayMessage manual
    // (daftar participant utk enkripsi) sudah tersedia SEBELUM pesan
    // benar-benar dikirim.
    // Header gambar DISAMBUNG LAGI di sini (headerType:4 + upload fresh
    // tiap kali, dibungkus timeout) — percobaan ke-6 s/d ke-9 yang dulu
    // gagal SEMUANYA lewat jalur relayMessage yang SAMA-SAMA belum punya
    // fix getGroupMetadata ini, jadi ada kemungkinan besar kegagalannya
    // bukan soal teknik headernya, tapi ikut kena masalah dekripsi yang
    // sama dengan tombolnya. Upload gagal/lambat → fallback headerType:1
    // (tombol tetap terkirim tanpa gambar) alih-alih gagal total.
    if (sock && jid) {
        try {
            const { generateWAMessageFromContent, prepareWAMessageMedia } = await import('@whiskeysockets/baileys');

            if (jid.endsWith('@g.us')) {
                try {
                    await withTimeout(getGroupMetadata(sock, jid), 15_000, 'getGroupMetadata(menu)');
                } catch (metaErr) {
                    log?.warn?.(`[menu] gagal refresh metadata grup sebelum kirim tombol (lanjut coba kirim tetap): ${metaErr.message}`);
                }
            }

            let headerImageMessage = null;
            try {
                const media = await withTimeout(
                    prepareWAMessageMedia(
                        getThumbnailImageContent(),
                        { upload: sock.waUploadToServer }
                    ),
                    30_000,
                    'prepareWAMessageMedia(menuThumbnail)'
                );
                headerImageMessage = media.imageMessage;
            } catch (thumbErr) {
                log?.warn?.(`[menu] upload thumbnail header gagal, tombol tetap dikirim tanpa gambar header: ${thumbErr.message}`);
            }

            const rows = [
                { title: '🤖 All Menu',  description: 'Lihat SEMUA command lengkap',      id: `${P}allmenu`     },
                { title: '👑 Owner',     description: 'Info pemilik & cara hubungi',       id: `${P}owner`       },
                { title: '💎 Premium',   description: 'Info & cara upgrade Premium',       id: `${P}pembayaran`  },
                { title: '📢 Channel',   description: 'Update & informasi bot',            id: `${P}credits`     },
                { title: '🛒 Sewa Bot',  description: 'Sewa bot ini untuk grup kamu',       id: `${P}sewa`        },
                { title: '💰 Buy Panel', description: 'Beli slot server hosting',          id: `${P}cpanel`      },
                { title: '📜 Rules',     description: 'Peraturan penggunaan bot',          id: `${P}rules`       },
                { title: '📞 Contact',   description: 'Bantuan & dukungan',                id: `${P}support`     },
                { title: '⚡ Ping',      description: 'Cek kecepatan respon bot',          id: `${P}ping`        },
                // ── Baris 4 (baru) — kategori menu, masing-masing nunjuk ke
                // command kategori yang SUDAH ADA & terdaftar di commands/index.js
                // (bukan tombol dummy — semuanya sudah bisa dipanggil manual juga).
                { title: '🤖 Menu Bot',   description: 'Kategori command umum bot',          id: `${P}menubot`   },
                { title: '👮 Menu Admin', description: 'Kategori command khusus admin grup', id: `${P}menuadmin` },
                { title: '🛠 Menu Tools', description: 'Kategori command tools & utilitas',  id: `${P}menutools` },
                { title: '🎵 Menu Media', description: 'Kategori command media & downloader',id: `${P}menumedia` },
                { title: '🖥 Menu CPanel',description: 'Kategori command Cpanel & hosting',   id: `${P}cpanel`    },
                { title: '🧠 Menu AI',    description: 'Kategori fitur AI & Gojo AI chat',    id: `${P}gojoai`    },
                { title: '🎮 Menu RPG',   description: 'Kategori command RPG & petualangan',  id: `${P}menurpg`   },
                { title: '👑 Menu Owner', description: 'Info Owner & Creator bot',            id: `${P}owner`     },
            ];

            const waMsg = generateWAMessageFromContent(jid, {
                buttonsMessage: {
                    contentText: `${completeMenuText}\n\nKetuk tombol di bawah buat mulai 👇`,
                    footerText: `© ${BOT}`,
                    ...(headerImageMessage
                        ? { headerType: 4, imageMessage: headerImageMessage }
                        : { headerType: 1 }),
                    viewOnce: true,
                    buttons: [
                        {
                            buttonId: `${P}allmenu`,
                            buttonText: { displayText: '🤖 All Menu' },
                            type: 1,
                        },
                        // Baris 2 — tombol cta_url, ketuk = langsung buka link channel
                        // (URL diatur di setting.js -> channelUrl, TIDAK hardcode di sini
                        // supaya gampang diganti tanpa bongkar file ini).
                        {
                            buttonId: 'testimoni',
                            buttonText: { displayText: '⭐ TESTIMONI' },
                            type: 1,
                            nativeFlowInfo: {
                                name: 'cta_url',
                                paramsJson: JSON.stringify({
                                    display_text: '⭐ TESTIMONI',
                                    url: settings.channelUrl,
                                    merchant_url: settings.channelUrl,
                                }),
                            },
                        },
                        {
                            buttonId: 'menu_list',
                            buttonText: { displayText: '☰ Menu Lengkap' },
                            type: 1,
                            nativeFlowInfo: {
                                name: 'single_select',
                                paramsJson: JSON.stringify({
                                    title: `${BOT} Menu`,
                                    sections: [
                                        { title: 'Baris 1', rows: rows.slice(0, 3) },
                                        { title: 'Baris 2', rows: rows.slice(3, 6) },
                                        { title: 'Baris 3', rows: rows.slice(6, 9) },
                                        { title: 'Baris 4', rows: rows.slice(9, 17) },
                                    ]
                                })
                            }
                        }
                    ]
                }
            }, { quoted: msg, userJid: sock.user?.jid });

            await sock.relayMessage(jid, waMsg.message, {
                messageId: waMsg.key.id,
                additionalNodes: [{
                    tag: 'biz',
                    attrs: {},
                    content: [{
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
                    }]
                }],
            });
            markMenuPending(sender);
            return;
        } catch (err) {
            log?.warn?.(`[menu] tombol interaktif gagal, fallback ke teks+gambar: ${err.message}`);
            // lanjut ke fallback di bawah
        }
    }

    markMenuPending(sender);
    await sendMenuReply(sock, jid, msg, settings.thumbnailUrl, completeMenuText);
}

// Versi ringkas dari replyWithImage() (commands/index.js) — sengaja
// diduplikasi kecil di sini, BUKAN di-import dari commands/index.js,
// supaya tidak bikin circular import (commands/index.js yang import
// sendMainMenu dari file ini). Perilakunya sama: kirim gambar dengan
// caption pendek kalau teksnya kepanjangan buat caption, teks lengkapnya
// nyusul sebagai pesan terpisah; fallback ke teks polos total kalau
// kirim gambar gagal.
const SAFE_CAPTION_LIMIT = 1000;
async function sendMenuReply(sock, jid, quotedMsg, imageUrl, text) {
    const full = safeReplyText(text);
    const tooLongForCaption = full.length > SAFE_CAPTION_LIMIT;
    const caption = tooLongForCaption
        ? `${truncate(full, SAFE_CAPTION_LIMIT)}\n\n👇 _Lanjutan di pesan berikutnya..._`
        : full;

    if (imageUrl) {
        try {
            // FIX (2026-08-06): pakai file lokal media/thumbnail.* kalau ada
            // — lihat lib/thumbnailSource.js. imageUrl tetap jadi penentu mau
            // kirim gambar atau tidak; isinya diganti ke sumber lokal kalau
            // persis settings.thumbnailUrl.
            const imageContent = imageUrl === settings.thumbnailUrl
                ? getThumbnailImageContent()
                : { image: { url: imageUrl } };
            await withTimeout(
                sock.sendMessage(jid, { ...imageContent, caption }, { quoted: quotedMsg }),
                30_000,
                'sendMessage(image)'
            );
            if (tooLongForCaption) {
                await sock.sendMessage(jid, { text: full }, { quoted: quotedMsg });
            }
            return;
        } catch (err) {
            log?.warn?.(`[menu] gagal kirim gambar thumbnail: ${err.message}`);
            // lanjut ke fallback teks biasa di bawah
        }
    }
    try {
        await sock.sendMessage(jid, { text: full }, { quoted: quotedMsg });
    } catch (err) {
        log?.error?.(`[menu] gagal kirim teks fallback: ${err.message}`);
    }
}

export async function sendRpgMenu(reply) {
    await reply(
`╔══════════════════════════════════════╗
║   ⚔️  *${sc('MENU RPG — DUNIA PETUALANGAN')}*
╚══════════════════════════════════════╝

╭─「 👤 *${sc('KARAKTER')}* 」
│ ${P}rpg          — Buat karakter baru
│ ${P}profil        — Lihat statistik karakter
│ ${P}class [nama]  — Ganti kelas (Warrior/Mage/Archer/Rogue)
│ ${P}inventory     — Buka tas / backpack
│ ${P}equip [item]  — Pakai senjata / armor
│ ${P}use [item]    — Gunakan potion / konsumabel
│ ${P}istirahat     — Pulihkan HP (cooldown 5m)
│ ${P}statdetail    — Statistik lengkap karakter
╰──────────────────────────────

╭─「 ⚔️ *${sc('PERTARUNGAN')}* 」
│ ${P}hunt           — Berburu monster (CD 45d)
│ ${P}lawan @tag     — Duel PvP dengan member
│ ${P}boss [nama]    — Raid boss kuat
│ ${P}dungeon [nama] — Masuk dungeon
│ ${P}bossinfo       — Daftar semua boss
│ ${P}dungeoninfo    — Daftar semua dungeon
╰──────────────────────────────

╭─「 💰 *${sc('EKONOMI & TOKO')}* 」
│ ${P}toko           — Buka toko item
│ ${P}beli [item]    — Beli item dari toko
│ ${P}jual [item]    — Jual item ke toko
│ ${P}daily          — Klaim reward harian (CD 24j)
│ ${P}kerja [job]    — Kerja cari gold (CD 20m)
│ ${P}joblist        — Daftar pekerjaan tersedia
│ ${P}nabung [jml]   — Simpan gold ke bank
│ ${P}tarik [jml]    — Tarik gold dari bank
│ ${P}transfer @tag  — Kirim gold ke player lain
│ ${P}rob @tag       — Curi gold player lain 🗡️
╰──────────────────────────────

╭─「 ✨ *${sc('GACHA & EKSPEDISI')}* 」
│ ${P}gacha          — Undian item acak (butuh tiket)
│ ${P}expedition     — Mulai ekspedisi (CD 6j)
│ ${P}klaimekspedisi — Ambil hasil ekspedisi
╰──────────────────────────────

╭─「 🐾 *${sc('PET SYSTEM')}* 」
│ ${P}petshop        — Toko peliharaan
│ ${P}buypet [nama]  — Beli pet baru
│ ${P}petinfo        — Info pet yang dimiliki
│ ${P}setpet [nama]  — Aktifkan pet tertentu
╰──────────────────────────────

╭─「 📜 *${sc('QUEST & ACHIEVEMENT')}* 」
│ ${P}quest          — Daftar quest aktif
│ ${P}questclaim [n] — Klaim reward quest selesai
│ ${P}achievement    — Lihat pencapaian
╰──────────────────────────────

╭─「 🏆 *${sc('RANKING & SOSIAL')}* 」
│ ${P}ranking        — Top 10 player
│ ${P}leaderboard    — Papan skor
│ ${P}marry @tag     — Menikah dengan player
│ ${P}divorce        — Cerai 💔
╰──────────────────────────────

╭─「 ⚒️ *${sc('CRAFTING & UPGRADE')}* 」
│ ${P}mine           — Tambang batu & ore (CD 30m)
│ ${P}fish           — Pancing ikan (CD 20m)
│ ${P}craft [item]   — Buat item baru
│ ${P}refine [item]  — Tingkatkan kualitas item
│ ${P}train [stat]   — Latihan tingkatkan stat
│ ${P}prestige       — Prestige (reset untuk bonus!)
╰──────────────────────────────


╭─「 🏰 *${sc('GUILD/CLAN')}* 」 _(baru!)_
│ ${P}guildcreate [nama] — Buat guild (500 gold)
│ ${P}guildjoin [nama]   — Gabung guild
│ ${P}guildleave         — Keluar guild
│ ${P}guildinfo [nama]   — Info guild
│ ${P}guildmembers       — Daftar member guild-mu
│ ${P}guildlist          — Semua guild
│ ${P}guilddonate [jml]  — Sumbang ke treasury
│ ${P}guildupgrade       — Naikkan level guild
│ ${P}guildpromote/demote @user — Atur Officer
│ ${P}guildkick @user    — Keluarkan member
│ ${P}guilddisband yakin — Bubarkan guild
╰──────────────────────────────

╭─「 🌾 *${sc('BERKEBUN')}* 」 _(baru!)_
│ ${P}plant [tanaman]  — Tanam (jagung/tomat/wortel/gandum)
│ ${P}water            — Siram tanaman
│ ${P}harvest          — Panen kalau sudah waktunya
│ ${P}farmstatus       — Cek status lahan
╰──────────────────────────────

╭─「 🍳 *${sc('MEMASAK')}* 」 _(baru!)_
│ ${P}cook [resep]     — Masak dari hasil panen
│ ${P}recipes          — Lihat semua resep
╰──────────────────────────────

╭─「 🏅 *${sc('TITLE')}* 」 _(baru!)_
│ ${P}titles           — Lihat semua title & status unlock
│ ${P}equiptitle [nama]— Pakai title yang sudah unlock
╰──────────────────────────────

╭─「 🎯 *${sc('BOUNTY HARIAN')}* 」 _(baru!)_
│ ${P}bounty        — Lihat target bounty hari ini
│ ${P}claimbounty   — Klaim hadiah (sekali/hari)
╰──────────────────────────────${buildRegistryCategoryPack('⚔️ RPG', '⚔️ RPG')}`
    );

}

// ─── DESKRIPSI FITUR DINAMIS ───────────────────────────────────────
// Semua command yang masuk registry harus punya keterangan yang menjelaskan
// fungsi sebenarnya. Ini dipakai oleh .menuadmin dan .allmenu, jadi tidak ada
// lagi fallback generik seperti "Fitur administrasi grup".
const ACTION_DESC = {
    audit: 'Mengaudit aktivitas dan perubahan grup',
    report: 'Mengelola laporan atau aduan',
    restore: 'Memulihkan data dari cadangan',
    backup: 'Mencadangkan data dan pengaturan',
    delete: 'Menghapus data atau konfigurasi',
    remove: 'Menghapus data atau anggota',
    schedule: 'Mengatur jadwal otomatis',
    protect: 'Mengaktifkan perlindungan grup',
    add: 'Menambahkan data atau anggota',
    del: 'Menghapus data atau konfigurasi',

    info: 'Menampilkan informasi dan detail fitur',
    status: 'Menampilkan status fitur atau sistem terkait',
    start: 'Memulai proses atau mode yang dipilih',
    stop: 'Menghentikan proses atau mode yang sedang aktif',
    create: 'Membuat data atau sesi baru',
    open: 'Membuka akses atau sesi',
    close: 'Menutup akses atau sesi yang aktif',
    enter: 'Masuk ke sesi, area, atau aktivitas',
    leave: 'Keluar dari sesi, area, atau aktivitas',
    join: 'Bergabung ke sesi atau aktivitas',
    list: 'Menampilkan daftar data yang tersedia',
    search: 'Mencari data berdasarkan kata kunci',
    find: 'Menemukan data yang sesuai dengan pencarian',
    inspect: 'Memeriksa detail objek atau data',
    scan: 'Memindai data untuk mencari hasil yang relevan',
    track: 'Melacak progres atau target yang dipilih',
    claim: 'Mengambil hadiah atau hasil yang sudah tersedia',
    complete: 'Menyelesaikan tugas atau aktivitas aktif',
    cancel: 'Membatalkan aktivitas yang sedang berjalan',
    accept: 'Menerima permintaan atau pilihan',
    decline: 'Menolak permintaan atau pilihan',
    buy: 'Membeli item atau layanan dengan saldo yang tersedia',
    sell: 'Menjual item dan menerima hasil penjualan',
    use: 'Menggunakan item atau fitur yang dipilih',
    equip: 'Memasang item atau perlengkapan ke karakter',
    unequip: 'Melepas item atau perlengkapan yang terpasang',
    upgrade: 'Meningkatkan level atau kualitas objek',
    repair: 'Memperbaiki kondisi objek yang rusak',
    craft: 'Membuat item baru dari bahan yang tersedia',
    refine: 'Memurnikan atau meningkatkan kualitas item',
    forge: 'Menempa perlengkapan menjadi versi yang lebih kuat',
    cook: 'Memasak item makanan dari bahan yang tersedia',
    feed: 'Memberi makanan atau item kepada karakter/hewan',
    train: 'Melatih karakter untuk meningkatkan kemampuan',
    heal: 'Memulihkan HP atau kondisi karakter',
    revive: 'Menghidupkan kembali karakter setelah kalah',
    attack: 'Menyerang target dalam sistem pertarungan',
    defend: 'Mengaktifkan aksi bertahan dalam pertarungan',
    dodge: 'Mencoba menghindari serangan lawan',
    parry: 'Mencoba menahan dan membalas serangan lawan',
    cast: 'Menggunakan kemampuan atau skill yang tersedia',
    learn: 'Mempelajari kemampuan atau pengetahuan baru',
    forget: 'Menghapus kemampuan atau data yang dipilih',
    unlock: 'Membuka fitur, area, atau kemampuan yang terkunci',
    lock: 'Mengunci fitur, area, atau akses tertentu',
    collect: 'Mengumpulkan item atau hadiah dari sumber terkait',
    deposit: 'Menyimpan saldo atau item ke penyimpanan',
    withdraw: 'Mengambil saldo atau item dari penyimpanan',
    pay: 'Mengirim pembayaran menggunakan saldo yang tersedia',
    give: 'Memberikan item atau hadiah kepada target',
    receive: 'Menerima item atau hadiah dari pengguna lain',
    send: 'Mengirim data atau item ke target',
    invite: 'Mengundang pengguna ke sesi atau aktivitas',
    kick: 'Mengeluarkan target dari sesi atau aktivitas',
    promote: 'Menaikkan peran target dalam sistem',
    demote: 'Menurunkan peran target dalam sistem',
    donate: 'Menyumbangkan item atau saldo ke target',
    build: 'Membangun struktur atau fasilitas baru',
    expand: 'Memperluas kapasitas atau wilayah yang tersedia',
    travel: 'Berpindah ke lokasi atau area lain',
    return: 'Kembali ke lokasi atau sesi sebelumnya',
    teleport: 'Berpindah lokasi secara instan',
    summon: 'Memanggil karakter, hewan, atau objek tertentu',
    dismiss: 'Membubarkan atau menghapus objek yang dipanggil',
    sacrifice: 'Menukar objek tertentu untuk mendapatkan efek atau hadiah',
    trade: 'Melakukan pertukaran item dengan target',
    bid: 'Mengajukan penawaran pada sistem lelang',
    sellout: 'Menjual seluruh item yang memenuhi syarat',
    roll: 'Menghasilkan pilihan acak menggunakan sistem roll',
    spin: 'Memutar pilihan acak untuk mendapatkan hasil',
    draw: 'Mengambil hasil acak dari kumpulan pilihan',
    choose: 'Memilih satu opsi dari pilihan yang tersedia',
    vote: 'Memberikan suara pada pilihan yang tersedia',
    challenge: 'Mengajak target mengikuti tantangan',
    rank: 'Menampilkan peringkat atau posisi pengguna',
    score: 'Menampilkan skor atau nilai yang diperoleh',
    top: 'Menampilkan pengguna dengan pencapaian tertinggi',
    history: 'Menampilkan riwayat aktivitas terkait',
    log: 'Menampilkan catatan aktivitas sistem',
    save: 'Menyimpan progres atau konfigurasi saat ini',
    load: 'Memuat data atau konfigurasi yang tersimpan',
    reset: 'Mengatur ulang data atau progres yang dipilih',
    rename: 'Mengubah nama objek atau profil',
    set: 'Mengatur nilai atau konfigurasi tertentu',
    get: 'Mengambil nilai atau data konfigurasi',
    view: 'Melihat detail data yang dipilih',
    show: 'Menampilkan data atau hasil yang tersedia',
    compare: 'Membandingkan dua data atau objek',
    moderate: 'Menjalankan moderasi pada target atau konten',
    protect: 'Mengaktifkan perlindungan untuk target terkait',
    secure: 'Memperketat keamanan pada target terkait',
    configure: 'Mengatur konfigurasi target terkait',
    backup: 'Membuat cadangan data target terkait',
    restore: 'Memulihkan data target dari cadangan',
    schedule: 'Menjadwalkan tindakan untuk target terkait',
    count: 'Menghitung jumlah data atau anggota yang sesuai',
    check: 'Memeriksa kondisi atau status target',
    reload: 'Memuat ulang konfigurasi atau komponen target',
    restart: 'Menjalankan ulang komponen atau sesi target',
    enable: 'Mengaktifkan fitur atau perlindungan target',
    disable: 'Menonaktifkan fitur atau perlindungan target',
    monitor: 'Memantau kondisi dan aktivitas target',
    owner: 'Mengelola informasi atau hak pemilik target',
    channel: 'Mengelola informasi kanal target',
    system: 'Memeriksa atau mengelola sistem target',
    version: 'Menampilkan versi target yang digunakan',
    export: 'Mengekspor data target ke format yang dapat digunakan',
    import: 'Mengimpor data dari sumber yang diberikan',
    convert: 'Mengonversi data ke format yang dipilih',
    encode: 'Mengubah data ke format encoding yang dipilih',
    decode: 'Mengembalikan data dari format encoding yang dipilih',
};

const ADMIN_TARGET = {
    group: 'grup', member: 'member', admin: 'admin', link: 'tautan grup',
    spam: 'spam', toxic: 'pesan toxic', media: 'media', image: 'gambar',
    video: 'video', audio: 'audio', document: 'dokumen', sticker: 'stiker',
    poll: 'polling', welcome: 'pesan welcome', farewell: 'pesan farewell',
    rules: 'aturan grup', warning: 'sistem peringatan', request: 'permintaan join',
    event: 'event grup', note: 'catatan grup', template: 'template grup',
    activity: 'aktivitas grup', invite: 'undangan grup', setting: 'pengaturan grup',
    security: 'keamanan grup',
};

function humanizeTarget(target) {
    return ADMIN_TARGET[target] || target.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
}

export function getFeatureDescription(name) {
    const n = String(name || '').toLowerCase();
    if (!n) return 'Menjalankan fitur bot.';

    const known = {
        play: 'Mencari lagu di YouTube lalu mengirim audionya',
        ytmp3: 'Mengunduh audio dari tautan YouTube',
        ytmp4: 'Mengunduh video dari tautan YouTube',
        tiktok: 'Mengunduh video TikTok melalui tautan',
        ig: 'Mengunduh media Instagram melalui tautan',
        brat: 'Membuat gambar teks bergaya Brat',
        menu: 'Menampilkan menu ringkas dan navigasi bot',
        allmenu: 'Menampilkan seluruh command yang tersedia',
        menuadmin: 'Menampilkan seluruh fitur khusus administrasi grup',
        menurpg: 'Menampilkan fitur RPG dan sistem petualangan',
        totalfitur: 'Menampilkan jumlah fitur unik yang terdaftar',
        ping: 'Mengecek latensi dan kesehatan respons bot',
    };
    if (known[n]) return known[n];

    if (n.startsWith('admin')) {
        const rest = n.slice(5);
        const action = Object.keys(ACTION_DESC).find(a => rest.startsWith(a));
        const target = action ? rest.slice(action.length) : rest;
        if (action && target) return `${ACTION_DESC[action]} untuk ${humanizeTarget(target)}`;
        if (action) return ACTION_DESC[action];
        return 'Mengelola pengaturan dan keamanan grup';
    }

    if (n.startsWith('rpg')) {
        const rest = n.slice(3);
        const action = Object.keys(ACTION_DESC).find(a => rest.startsWith(a));
        const target = action ? rest.slice(action.length) : rest;
        if (action && target) return `${ACTION_DESC[action]} dalam sistem RPG ${humanizeTarget(target)}`;
        if (action) return ACTION_DESC[action] + ' dalam sistem RPG';
        return 'Mengelola karakter, progres, dan aktivitas RPG';
    }

    if (n.startsWith('fun')) {
        const rest = n.slice(3);
        const action = Object.keys(ACTION_DESC).find(a => rest.startsWith(a));
        const target = action ? rest.slice(action.length) : rest;
        if (action && target) return `${ACTION_DESC[action]} untuk permainan ${humanizeTarget(target)}`;
        return action ? ACTION_DESC[action] + ' untuk hiburan' : 'Menjalankan permainan atau hiburan interaktif';
    }

    if (n.startsWith('tool')) {
        const rest = n.slice(4);
        const action = Object.keys(ACTION_DESC).find(a => rest.startsWith(a));
        const target = action ? rest.slice(action.length) : rest;
        if (action && target) return `${ACTION_DESC[action]} pada ${humanizeTarget(target)}`;
        return action ? ACTION_DESC[action] : 'Menjalankan utilitas untuk mengolah atau memeriksa data';
    }

    if (n.startsWith('media')) {
        const rest = n.slice(5);
        const mediaAction = {
            hd: 'Meningkatkan kualitas media agar lebih tajam',
            crop: 'Memotong media sesuai ukuran yang dipilih',
            rotate: 'Memutar media sesuai sudut yang dipilih',
            blur: 'Memberikan efek blur pada media',
            mirror: 'Membalik media secara horizontal',
            extractaudio: 'Mengambil audio dari video',
            reverse: 'Memutar video dari akhir ke awal',
        };
        if (mediaAction[rest]) return mediaAction[rest];
        return 'Mengolah gambar, video, audio, atau media sesuai pilihan';
    }

    if (n.startsWith('bot')) {
        const rest = n.slice(3);
        const action = Object.keys(ACTION_DESC).find(a => rest.startsWith(a));
        const target = action ? rest.slice(action.length) : rest;
        if (action && target) return `${ACTION_DESC[action]} untuk sistem ${humanizeTarget(target)}`;
        return 'Mengelola informasi dan utilitas sistem bot';
    }

    if (n.startsWith('social')) return 'Mengunduh atau memproses konten media sosial';
    if (n.startsWith('cpanel')) return 'Mengelola layanan panel dan server sesuai hak akses';
    if (n.startsWith('sewa')) return 'Mengelola layanan sewa bot dan status sewa';
    if (n.startsWith('owner') || n.startsWith('creator')) return 'Menampilkan informasi dan kontrol pemilik bot';
    if (n.startsWith('premium')) return 'Mengelola atau menampilkan fitur Premium';

    const specific = {
        daftar: 'Mendaftarkan profil pengguna agar fitur yang membutuhkan registrasi dapat digunakan',
        class: 'Memilih atau mengganti kelas karakter RPG',
        profil: 'Menampilkan profil dan statistik karakter pengguna',
        inventory: 'Membuka inventori dan melihat item yang dimiliki',
        equip: 'Memasang perlengkapan yang dipilih pada karakter',
        unequip: 'Melepas perlengkapan yang sedang digunakan',
        use: 'Menggunakan item atau konsumabel yang dipilih',
        istirahat: 'Memulihkan kondisi karakter setelah aktivitas RPG',
        hunt: 'Berburu monster untuk mendapatkan EXP dan hadiah',
        lawan: 'Mengajak pengguna lain bertarung dalam duel RPG',
        boss: 'Menantang boss RPG untuk mendapatkan hadiah',
        dungeon: 'Memasuki dungeon dan menghadapi musuh di dalamnya',
        toko: 'Membuka toko item RPG',
        beli: 'Membeli item dari toko menggunakan saldo yang tersedia',
        jual: 'Menjual item dan menerima hasil penjualan',
        daily: 'Mengambil hadiah harian pengguna',
        kerja: 'Bekerja untuk mendapatkan penghasilan dalam sistem RPG',
        nabung: 'Menyimpan gold ke bank RPG',
        tarik: 'Mengambil gold dari bank RPG',
        transfer: 'Mengirim gold kepada pengguna lain',
        rob: 'Mencoba merampok gold pengguna lain dalam sistem RPG',
        petshop: 'Membuka toko dan daftar pet yang tersedia',
        buypet: 'Membeli pet baru untuk karakter',
        petinfo: 'Melihat statistik dan informasi pet aktif',
        quest: 'Melihat quest RPG yang tersedia',
        questclaim: 'Mengambil hadiah dari quest yang telah selesai',
        achievement: 'Melihat pencapaian RPG yang sudah dibuka',
        ranking: 'Menampilkan peringkat pemain RPG',
        leaderboard: 'Menampilkan papan skor pemain',
        mine: 'Menambang material dan ore untuk mendapatkan item',
        fish: 'Memancing untuk mendapatkan ikan dan hadiah',
        craft: 'Membuat item dari material yang tersedia',
        refine: 'Meningkatkan kualitas item menggunakan material',
        train: 'Melatih karakter untuk meningkatkan kemampuan',
        prestige: 'Melakukan prestige untuk mendapatkan bonus progres',
        gacha: 'Melakukan undian item dengan sistem gacha',
        expedition: 'Mengirim karakter dalam ekspedisi untuk mencari hadiah',
        play: 'Mencari lagu berdasarkan judul lalu mengirim audionya',
        ytmp4: 'Mengunduh video YouTube dari tautan yang diberikan',
        ig: 'Mengunduh media Instagram dari tautan',
        tiktok: 'Mengunduh video TikTok dari tautan',
        twitter: 'Mengunduh media dari X/Twitter melalui tautan',
        facebook: 'Mengunduh media Facebook dari tautan',
        scdl: 'Mengunduh audio dari SoundCloud',
        pin: 'Mengunduh media Pinterest dari tautan',
        threads: 'Mengunduh media Threads dari tautan',
        reddit: 'Mengunduh media Reddit dari tautan',
        bilibili: 'Mengunduh media Bilibili dari tautan',
        dailymotion: 'Mengunduh video Dailymotion dari tautan',
        vimeo: 'Mengunduh video Vimeo dari tautan',
        snackvideo: 'Mengunduh video SnackVideo dari tautan',
        quote: 'Mengirim kutipan acak untuk hiburan atau motivasi',
        fact: 'Menampilkan fakta unik secara acak',
        riddle: 'Memberikan teka-teki untuk dijawab pengguna',
        truth: 'Memberikan pertanyaan Truth untuk permainan',
        dare: 'Memberikan tantangan Dare untuk permainan',
        pantun: 'Membuat atau menampilkan pantun acak',
        coinflip: 'Melempar koin dan menentukan hasil acak',
        dice: 'Melempar dadu dengan jumlah sisi yang dipilih',
        rps: 'Memainkan Batu-Gunting-Kertas melawan bot',
        slot: 'Memainkan mesin slot virtual',
        tarot: 'Mengambil kartu tarot secara acak untuk hiburan',
        lovecalc: 'Menghasilkan skor kecocokan hiburan berdasarkan nama',
        upper: 'Mengubah teks menjadi huruf kapital',
        lower: 'Mengubah teks menjadi huruf kecil',
        reverse: 'Membalik urutan karakter pada teks',
        calc: 'Menghitung ekspresi matematika yang diberikan',
        persen: 'Menghitung persentase dari angka yang diberikan',
        bmi: 'Menghitung indeks massa tubuh dari data yang diberikan',
        kurs: 'Mengonversi atau menampilkan nilai kurs mata uang',
        umur: 'Menghitung usia berdasarkan tanggal lahir',
        convertlength: 'Mengonversi satuan panjang',
        convertweight: 'Mengonversi satuan berat',
        convertsuhu: 'Mengonversi suhu antar satuan',
        genpassword: 'Membuat password acak dengan panjang yang dipilih',
        genuuid: 'Membuat UUID acak baru',
        pilih: 'Memilih satu opsi secara acak dari daftar',
        shuffle: 'Mengacak urutan daftar yang diberikan',
        ping: 'Mengecek latensi dan respons bot',
        owner: 'Menampilkan informasi pemilik bot',
        pembayaran: 'Menampilkan informasi pembayaran yang tersedia',
        cpanel: 'Membuka pengelolaan panel server Pterodactyl',
        sewa: 'Menampilkan dan mengelola layanan sewa bot',
        brat: 'Membuat gambar teks menggunakan generator Brat',
        iqc: 'Membuat gambar chat bergaya iPhone',
        sticker: 'Mengubah media yang diberikan menjadi stiker WhatsApp',
        botstats: 'Menampilkan statistik penggunaan bot',
        changelog: 'Menampilkan riwayat perubahan dan pembaruan bot',
        credits: 'Menampilkan teknologi dan kredit pengembangan bot',
        support: 'Menampilkan panduan bantuan dan dukungan bot',
        version: 'Menampilkan versi Gojo Satoru MD V2',
    };
    if (specific[n]) return specific[n];

    // Fallback semantik terakhir: tetap menjelaskan tindakan berdasarkan
    // kata kerja command, bukan kalimat placeholder/generik.
    const verbs = Object.keys(ACTION_DESC).sort((a,b) => b.length - a.length);
    const verb = verbs.find(v => n === v || n.startsWith(v));
    if (verb) {
        const target = n === verb ? '' : n.slice(verb.length);
        return target
            ? `${ACTION_DESC[verb]} pada ${target.replace(/([a-z])(?=[0-9])/g, '$1 ').replace(/([a-z])([A-Z])/g, '$1 $2')}`
            : ACTION_DESC[verb];
    }
    return 'Menjalankan perintah sesuai nama command dan input yang diberikan';
}

// ─── MENU ADMIN ───────────────────────────────────────────────────
export async function sendAdminMenu(reply) {
    // Fitur tambahan registry tetap dimasukkan, tetapi dikelompokkan lagi
    // berdasarkan fungsi. Command yang sudah tampil di menu utama admin
    // tidak digandakan.
    const adminPack = buildRegistryCategoryPack('🛡️ Admin', '🛡️ Admin');

    await reply(
`╔══════════════════════════════════════╗
║   🛡️  *${sc('MENU ADMIN & MANAJEMEN GRUP')}*
╚══════════════════════════════════════╝

╭─「 👥 *${sc('MANAJEMEN MEMBER')}* 」
│ ${P}kick @tag        — Keluarkan member
│ ${P}promote @tag     — Jadikan admin
│ ${P}demote @tag      — Cabut jabatan admin
│ ${P}add 628xxx       — Tambah member baru
│ ${P}listadmin        — Daftar admin grup
│ ${P}membercount      — Jumlah total member
╰──────────────────────────────

╭─「 👑 *${sc('JABATAN BOT')}* 」
│ ${P}cekjabatan [@tag] — Cek jabatan (Creator/Owner/Premium)
│ ${P}addowner @tag    — Angkat Owner _(Creator only)_
│ ${P}delowner @tag    — Cabut Owner _(Creator only)_
│ ${P}listowner        — Daftar Creator & Owner
│ ${P}addprem @tag     — Angkat Premium _(Owner only)_
│ ${P}delprem @tag     — Cabut Premium _(Owner only)_
│ ${P}listprem         — Daftar user Premium
│
│ _Bisa juga diatur permanen lewat_
│ _\`ownerNumbers\` / \`premiumNumbers\`_
│ _di setting.js (butuh restart)._
╰──────────────────────────────

╭─「 ⚠️ *${sc('SISTEM WARN')}* 」
│ ${P}warn @tag        — Beri peringatan
│ ${P}unwarn @tag      — Hapus peringatan
│ ${P}checkwarn @tag   — Cek jumlah warn
│ ${P}warnlimit [n]    — Atur batas warn (default 3)
╰──────────────────────────────

╭─「 🔇 *${sc('MUTE & KUNCI GRUP')}* 」
│ ${P}mute [durasi]    — Mute semua member
│ ${P}unmute           — Unmute grup
│ ${P}mutestatus       — Cek status mute
│ ${P}lockgroup        — Kunci grup (hanya admin bisa chat)
│ ${P}unlockgroup      — Buka kunci grup
│ ${P}opengroup        — Buka akses chat grup
│ ${P}closegroup       — Tutup akses chat grup
│ ${P}slowmode [detik] — Aktifkan slow mode
│ ${P}lockmedia on/off — Kunci pengiriman media
│ ${P}lockstiker on/off— Kunci pengiriman stiker
╰──────────────────────────────

╭─「 ⚙️ *${sc('PENGATURAN GRUP')}* 」
│ ${P}groupinfo        — Info lengkap grup
│ ${P}setname [nama]   — Ubah nama grup
│ ${P}setdesc [teks]   — Ubah deskripsi grup
│ ${P}link             — Dapatkan link undangan
│ ${P}revoke           — Reset link undangan
│ ${P}leave            — Bot keluar dari grup
│ ${P}hidetag [teks]   — Mention semua (tersembunyi)
│ ${P}tagall [teks]    — Mention semua member
╰──────────────────────────────

╭─「 👋 *${sc('WELCOME & FAREWELL')}* 」
│ ${P}welcome on/off   — Toggle pesan sambutan
│ ${P}setwelcome [teks]— Atur teks sambutan
│ ${P}farewell on/off  — Toggle pesan perpisahan
│ ${P}setfarewell [txt]— Atur teks perpisahan
│   _Variabel: {name} {group} {num}_
╰──────────────────────────────

╭─「 🛡️ *${sc('PROTEKSI')}* 」
│ ${P}antigb on/off         — Anti link grup WA
│ ${P}antilink on/off       — Anti semua link
│ ${P}antishortlink on/off  — Anti link pemendek
│ ${P}antilinkphising on/off— Anti link/pola phising
│ ${P}antispam on/off       — Anti spam pesan
│ ${P}antitoxic on/off      — Anti kata kasar
│ ${P}antijudol on/off      — Anti promosi judi online
│ ${P}antipinjol on/off     — Anti promosi pinjol ilegal
│ ${P}anticaps on/off       — Anti HURUF KAPITAL berlebihan
│ ${P}antivirtex on/off     — Anti teks virus/zalgo
│ ${P}antitag on/off        — Anti spam mention massal
│ _(Anti-flood otomatis aktif jika antispam on)_
│
│ ${P}resetprotection   — Matikan SEMUA proteksi sekaligus
│ ${P}antilinkall on/off— Semua proteksi link sekaligus
│ ${P}grouplockstatus   — Lihat status semua proteksi & lock
│ ${P}helpproteksi      — Cheatsheet ringkas semua proteksi
╰──────────────────────────────

╭─「 🔒 *${sc('LOCK KONTEN GRANULAR')}* 」
│ ${P}lockimage on/off    — Kunci gambar
│ ${P}lockvideo on/off    — Kunci video
│ ${P}lockdocument on/off — Kunci dokumen (.apk dll)
│ ${P}lockcontact on/off  — Kunci kontak/vCard
│ ${P}locklocation on/off — Kunci share lokasi
│ ${P}lockvn on/off       — Kunci voice note
│ ${P}lockaudio on/off    — Kunci file audio/musik
│ ${P}lockgif on/off      — Kunci GIF
│ ${P}lockpoll on/off     — Kunci polling
│ _(terpisah dari ${P}lockmedia — bisa kunci 1 jenis saja)_
╰──────────────────────────────

╭─「 📝 *${sc('KATA TERLARANG, LINK & WHITELIST')}* 」
│ ${P}addbadword [kata]  — Tambah kata terlarang custom
│ ${P}delbadword [kata]  — Hapus kata terlarang custom
│ ${P}listbadword        — Lihat daftar kata custom
│ ${P}allowlinkadd [dom] — Kecualikan domain dari Anti-Link
│ ${P}allowlinkdel [dom] — Hapus pengecualian domain
│ ${P}allowlinklist      — Lihat daftar domain dikecualikan
│ ${P}whitelistadd @tag  — Bebaskan member dari proteksi baru
│ ${P}whitelistdel @tag  — Hapus dari whitelist
│ ${P}whitelist          — Lihat daftar whitelist
╰──────────────────────────────

╭─「 📊 *${sc('POLL, JADWAL & LAPORAN')}* 」
│ ${P}poll [q]|[a]|[b] — Buat polling
│ ${P}vote [id] [no]   — Pilih jawaban poll
│ ${P}hasilpoll [id]   — Lihat hasil poll
│ ${P}listpoll         — Semua poll aktif
│ ${P}addjadwal [teks] — Tambah jadwal grup
│ ${P}listjadwal       — Lihat semua jadwal
│ ${P}deljadwal [no]   — Hapus jadwal
│ ${P}lapor [isi]      — Laporkan ke admin
│ ${P}listlaporan      — Lihat semua laporan
│ ${P}clearlaporan     — Hapus semua laporan
│ ${P}aktivitasgrup    — Statistik aktivitas
╰──────────────────────────────

╭─「 👀 *${sc('SIDER (MEMBER GAK AKTIF)')}* 」
│ ${P}sider [durasi]     — Cek member yg gak/jarang chat
│ ${P}kicksider [durasi] — Kick semua sider sekaligus
│ _Default durasi: 3 hari. Contoh: ${P}sider 7d_
│ _Admin grup tidak pernah dihitung sider._
╰──────────────────────────────

╭─「 📋 *${sc('FITUR LAIN')}* 」
│ ${P}ban @tag         — Ban user dari bot
│ ${P}unban @tag       — Unban user
│ ${P}banlist          — Lihat daftar user diblokir
│ ${P}unbanall         — Buka semua blokir sekaligus
│ ${P}autoreply [...]  — Atur auto-reply
│ ${P}notes [...]      — Catatan grup
╰──────────────────────────────

╭─「 👥➕ *${sc('MANAJEMEN MEMBER LANJUTAN')}* 」
│ ${P}kickall yakin    — Keluarkan SEMUA non-admin
│ ${P}warnall          — Beri warn ke SEMUA non-admin
│ ${P}cekwarnall       — Lihat semua member yg punya warn
│ ${P}topwarn          — Ranking member warn terbanyak
│ ${P}resetwarnall     — Reset semua data warn grup ini
│ ${P}mutemember @tag  — Bisukan 1 member (bukan grup)
│ ${P}unmutemember @tag— Buka bisu 1 member
│ ${P}listmutedmember  — Lihat member yang dibisukan
╰──────────────────────────────

╭─「 📥 *${sc('APPROVAL JOIN REQUEST')}* 」
│ _(khusus grup mode "Perlu Persetujuan Admin")_
│ ${P}listrequest         — Lihat permintaan join tertunda
│ ${P}approverequest 62xx — Terima 1 permintaan
│ ${P}rejectrequest 62xx  — Tolak 1 permintaan
│ ${P}terimarequest 62xx  — Alias untuk menerima permintaan
│ ${P}tolakrequest 62xx   — Alias untuk menolak permintaan
│ ${P}approveall          — Terima semua sekaligus
│ ${P}rejectall           — Tolak semua sekaligus
╰──────────────────────────────

╭─「 ⏰ *${sc('JADWAL BUKA/TUTUP OTOMATIS')}* 」
│ ${P}jadwalbuka 07:00  — Jadwal buka grup tiap hari
│ ${P}jadwaltutup 22:00 — Jadwal tutup grup tiap hari
│ ${P}cekjadwalgrup     — Lihat jadwal aktif
│ ${P}canceljadwalgrup  — Batalkan jadwal
╰──────────────────────────────

╭─「 ⚙️➕ *${sc('KONFIGURASI GRUP LANJUTAN')}* 」
│ ${P}seticon        — Set foto grup (reply gambar)
│ ${P}hapusicon      — Hapus foto grup
│ ${P}lockinfo       — Kunci info grup (nama/ikon/desc)
│ ${P}unlockinfo     — Buka kunci info grup
│ ${P}ephemeral [d]  — Pesan sementara: off/1d/7d/90d
│ ${P}backupsetting  — Backup semua pengaturan grup
│ ${P}restoresetting — Kembalikan dari backup
╰──────────────────────────────

╭─「 📊 *${sc('DASHBOARD & INFO GRUP')}* 」
│ ${P}groupsummary   — Dashboard ringkas grup
│ ${P}groupage       — Umur grup ini
│ ${P}admincount     — Jumlah admin
│ ${P}groupcreator   — Siapa pembuat grup
│ ${P}exportmember   — Export data semua member
│ ${P}cekbot         — Cek status admin bot di grup ini
╰──────────────────────────────

╭─「 📢 *${sc('PENGUMUMAN & CATATAN')}* 」 _(baru!)_
│ ${P}setpengumuman [teks] — Pasang pengumuman grup
│ ${P}pengumuman            — Lihat pengumuman aktif
│ ${P}hapuspengumuman       — Hapus pengumuman
│ ${P}addmembernote @user [catatan] — Catatan ttg 1 member
│ ${P}listmembernote @user — Lihat catatan member
│ ${P}delmembernote @user [no] — Hapus 1 catatan
╰──────────────────────────────

╭─「 🗂️ *${sc('TEMPLATE GRUP')}* 」 _(baru!)_
│ ${P}savetemplate [nama] — Simpan snapshot proteksi grup
│ ${P}loadtemplate [nama] — Terapkan template ke grup ini
│ ${P}listtemplate        — Semua template tersimpan
│ ${P}deltemplate [nama]  — Hapus template
╰──────────────────────────────

╭─「 ⏰ *${sc('PENGUMUMAN TERJADWAL & ULTAH')}* 」 _(baru!)_
│ ${P}addannouncement 08:00 [teks] — Pesan berulang harian
│ ${P}listannouncement    — Lihat semua jadwal
│ ${P}delannouncement [no]— Hapus jadwal
│ ${P}setbirthday DD-MM   — Simpan tanggal lahirmu
│ ${P}listbirthday        — Daftar ultah member grup
│ _(Bot otomatis ucapin jam 08:00 pas harinya)_
╰──────────────────────────────

╭─「 ⚡ *${sc('BULK, AKTIVITAS & TUGAS')}* 」 _(baru!)_
│ ${P}bulkpromote/bulkdemote @user1 @user2 ... — Massal
│ ${P}bulkkick @user1 @user2 ... — Keluarkan banyak sekaligus
│ ${P}topactive          — Leaderboard member paling aktif
│ ${P}listinactive [hari]— Member yang gak aktif
│ ${P}assigntask @user [tugas] — Kasih tugas ke member
│ ${P}mytasks            — Lihat tugasmu
│ ${P}listtasks          — Semua tugas aktif (admin)
│ ${P}donetask [no]      — Tandai tugas selesai
│ ${P}maintenancemode on/off — Bot cuma respon Owner sementara
╰──────────────────────────────

╭─「 🎉 *${sc('EVENT & QUICK LOCK')}* 」 _(baru!)_
│ ${P}createevent YYYY-MM-DD [teks] — Buat event
│ ${P}rsvp [id] ya/tidak — Konfirmasi kehadiran
│ ${P}listevents / eventattendees [id]
│ ${P}quicklock  — Aktifkan proteksi darurat sekaligus
│ ${P}quickunlock — Matikan lagi
│ ${P}grouplinkqr — QR code link invite grup ini
│ ${P}previewwelcome — Lihat preview pesan welcome

╭─「 🧩 *${sc('ADMIN LANJUTAN')}* 」
│ ${P}setrules [teks]       — Atur aturan grup
│ ${P}addnote [teks]        — Tambah catatan grup
│ ${P}delnote [no]          — Hapus catatan grup
│ ${P}pollnative [tanya]    — Buat polling native WhatsApp
│ ${P}antidelete on/off     — Proteksi pesan yang dihapus
│ ${P}statsgrupmember       — Statistik member grup
│ ${P}listautoreply         — Lihat auto-reply grup
│ ${P}cekaturangrup         — Lihat aturan grup
│ ${P}simpancatatan [teks]  — Simpan catatan
│ ${P}lihatcatatan          — Lihat catatan
│ ${P}buatpolling            — Buat polling
│ ${P}statistikgrup          — Statistik aktivitas grup
│ ${P}blokirpengguna @tag   — Blokir pengguna dari bot
│ ${P}bukablokirpengguna @tag — Buka blokir pengguna
│ ${P}aturautobalas [teks]  — Atur auto-reply
│ ${P}lihatautobalas        — Lihat auto-reply
│ ${P}votekick @tag         — Voting untuk mengeluarkan member
│ ${P}setmotd [teks]        — Atur pesan utama grup
│ ${P}motd                  — Lihat pesan utama grup
│ ${P}pollclose [id]        — Tutup polling aktif
│ ${P}bulkdemote @tag       — Turunkan beberapa admin
│ ${P}eventattendees [id]   — Lihat peserta event
│ ${P}admincount            — Hitung jumlah admin grup
│ ${P}antinsfw on/off       — Atur proteksi NSFW
│ ${P}locktext on/off       — Kunci pesan teks
│ ${P}slowmodeoff           — Matikan slow mode
│
│ _Semua command di bagian ini memang terdaftar_
│ _sebagai fitur admin; tidak memakai nama placeholder._
╰──────────────────────────────

${adminPack}
╰──────────────────────────────`
    );
}

// ─── MENU FUN ─────────────────────────────────────────────────────
export async function sendFunMenu(reply) {
    await reply(
`╔══════════════════════════════════════╗
║   🎮  *${sc('MENU FUN, GAME & HIBURAN')}*
╚══════════════════════════════════════╝

╭─「 🎲 *${sc('GAME KLASIK')}* 」
│ ${P}quote         — Kutipan motivasi acak
│ ${P}fact          — Fakta unik menarik
│ ${P}riddle        — Teka-teki (tebak jawabannya!)
│ ${P}truth         — Pertanyaan truth
│ ${P}dare          — Tantangan dare
│ ${P}pantun        — Berbalas pantun
│ ${P}coinflip      — Lempar koin
│ ${P}dice [sisi]   — Lempar dadu
│ ${P}rps [pilihan] — Batu Gunting Kertas
│ ${P}slot          — Mesin slot 🎰
│ ${P}tebakangka    — Mulai tebak angka
│ ${P}tebak [angka] — Jawab tebak angka
╰──────────────────────────────

╭─「 💕 *${sc('ROMANCE & SOSIAL')}* 」
│ ${P}wyr           — Would You Rather
│ ${P}jodoh @tag    — Cek kompatibilitas jodoh 💑
│ ${P}tarot         — Baca kartu tarot hari ini
│ ${P}fortunecookie — Kue keberuntungan 🍪
│ ${P}lovecalc [nm] — Kalkulator cinta
│ ${P}zodiak [tgl]  — Cek zodiak & ramalan
╰──────────────────────────────

╭─「 🧠 *${sc('MINI GAME')}* 」
│ ${P}trivia            — Pertanyaan trivia
│ ${P}jawabtrivia [jwb] — Jawab trivia
│ ${P}wordscramble      — Tebak kata acak
│ ${P}jawabscramble     — Jawab wordscramble
│ ${P}riddle2           — Teka-teki edisi 2
│ ${P}jawabriddle2      — Jawab teka-teki
│ ${P}guesshilo         — Game higher or lower
│ ${P}tebakhilo [n]     — Tebak higher/lower
│ ${P}tebakgambar       — Tebak gambar 🖼️
╰──────────────────────────────

╭─「 🎉 *${sc('RANDOM FUN')}* 」
│ ${P}dadjoke          — Lelucon bapak 😂
│ ${P}konspirasi       — Teori konspirasi lucu
│ ${P}kepribadianhariini — Kepribadian hari ini
│ ${P}katahariini      — Kata-kata of the day
│ ${P}pilihini         — This or That?
│ ${P}magic8ball [?]   — Bola kedelapan ajaib
│ ${P}ratehariini      — Rate hari ini
│ ${P}angkakeberuntungan — Angka hoki
│ ${P}emojirandom      — Emoji random
│ ${P}pengagumrahasia  — Siapa yang diam-diam suka kamu? 👀
│ ${P}afirmasihariini  — Afirmasi positif
╰──────────────────────────────

╭─「 🎭 *${sc('ROAST & PUJIAN')}* 」
│ ${P}roast @tag       — Sindir member (bercanda!) 😈
│ ${P}compliment @tag  — Puji member 💐
│ ${P}pujianrandom2    — Pujian random edisi 2
│ ${P}rayuan           — Kata rayuan gombal
│ ${P}pernahkah        — Never Have I Ever
│ ${P}pembukacerita    — Story starter acak
│ ${P}tantanganrandom  — Tantangan seru
╰──────────────────────────────

╭─「 🎯 *${sc('LAINNYA')}* 」
│ ${P}mbtitoday    — Tebak MBTI hari ini
│ ${P}nomorhoki    — Nomor keberuntunganmu
│ ${P}moodku       — Mood hari ini
│ ${P}rolldadu [n] — Roll banyak dadu sekaligus
╰──────────────────────────────

╭─「 💙 *${sc('GOJO SATORU SPECIAL')}* 」
│ ${P}gojo            — Kutipan random ala Gojo Satoru
│ ${P}gojoteknik      — Jurus/teknik Gojo (acak)
│ ${P}gojoroast @tag  — Diroasting ala Gojo 😏
│ ${P}gojohype @tag   — Disemangatin ala Gojo 💪
│ ${P}gojofact        — Fakta seputar Gojo Satoru
│ ${P}gojopower @tag  — Cek "power level" ala Gojo
╰──────────────────────────────${buildRegistryCategoryPack('🎮 Fun', '🎮 Fun')}`
    );

}

// ─── MENU TOOLS ───────────────────────────────────────────────────
export async function sendToolsMenu(reply) {
    await reply(
`╔══════════════════════════════════════╗
║   🛠️  *${sc('MENU TOOLS & UTILITY')}*
╚══════════════════════════════════════╝

╭─「 ℹ️ *${sc('INFO BOT')}* 」
│ ${P}pembayaran — Info pembayaran (DANA/GoPay/OVO)
│ ${P}sosmedowner — Sosial media Owner
│ ${P}owner   — Info & kontak developer
│ ${P}ping    — Cek latensi & status bot
│ ${P}whoami  — Lihat info nomormu
│ ${P}runtime — Lama bot sudah aktif
│ ${P}jam     — Waktu server sekarang
╰──────────────────────────────

╭─「 🔤 *${sc('MANIPULASI TEKS')}* 」
│ ${P}upper [teks]     — HURUF BESAR SEMUA
│ ${P}lower [teks]     — huruf kecil semua
│ ${P}reverse [teks]   — sket terbalik
│ ${P}alternating      — HuRuF SeLaNg-SeLiNg
│ ${P}titlecase [teks] — Setiap Kata Kapital
│ ${P}camelcase        — camelCaseFormat
│ ${P}snakecase        — snake_case_format
│ ${P}kebabcase        — kebab-case-format
│ ${P}leet [teks]      — l337 sp34k
│ ${P}rot13 [teks]     — ROT13 cipher
│ ${P}wordcount [teks] — Hitung jumlah kata
│ ${P}hitungvokal      — Hitung huruf vokal
│ ${P}hitungkonsonan   — Hitung konsonan
│ ${P}hapusvokal       — Hapus semua vokal
│ ${P}ulangteks [n]    — Ulangi teks N kali
│ ${P}frekuensikata    — Frekuensi tiap kata
╰──────────────────────────────

╭─「 🔐 *${sc('ENKRIPSI & ENCODING')}* 」
│ ${P}tobinary [txt]   — Teks → Binary
│ ${P}frombinary [bin] — Binary → Teks
│ ${P}tobase64 [txt]   — Teks → Base64
│ ${P}frombase64 [b64] — Base64 → Teks
│ ${P}tohex [txt]      — Teks → Hexadecimal
│ ${P}fromhex [hex]    — Hex → Teks
│ ${P}tomorse [txt]    — Teks → Morse Code
│ ${P}frommorse [...]  — Morse → Teks
│ ${P}caesarenkrip [n] — Caesar cipher encrypt
│ ${P}caesardekrip [n] — Caesar cipher decrypt
│ ${P}textascii [txt]  — Teks → ASCII codes
│ ${P}asciitext [...]  — ASCII → Teks
╰──────────────────────────────

╭─「 🔢 *${sc('MATEMATIKA')}* 」
│ ${P}calc [expr]      — Kalkulator pintar
│ ${P}persen [a] [b]   — Hitung persentase
│ ${P}persenubah [a][b]— Perubahan persentase
│ ${P}bmi [kg] [cm]    — Hitung BMI
│ ${P}bmidetail        — BMI detail lengkap
│ ${P}umur [YYYY-MM-DD]— Hitung usia
│ ${P}cekprima [n]     — Cek bilangan prima
│ ${P}faktorial [n]    — Hitung faktorial
│ ${P}fibonacci [n]    — Deret Fibonacci
│ ${P}gcdlcm [a] [b]   — FPB dan KPK
│ ${P}roman [n]        — Angka → Romawi
│ ${P}kuadrat [a][b][c]— Rumus kuadrat
│ ${P}average [...]    — Rata-rata angka
│ ${P}median [...]     — Nilai median
╰──────────────────────────────

╭─「 📐 *${sc('KONVERSI')}* 」
│ ${P}convertlength    — Konversi panjang
│ ${P}convertweight    — Konversi berat
│ ${P}suhu [n] [mode]  — Konversi suhu
│   _(c2f / f2c / c2k / k2c)_
│ ${P}suhulengkap [n]  — Konversi ke semua
╰──────────────────────────────

╭─「 💸 *${sc('KEUANGAN')}* 」
│ ${P}diskon [harga]%  — Hitung diskon
│ ${P}splitbill [..][n]— Bagi tagihan rata
│ ${P}hitungtip [bill] — Hitung tip (%)
╰──────────────────────────────

╭─「 ✅ *${sc('VALIDATOR')}* 」
│ ${P}cekpalindrom     — Cek palindrom
│ ${P}cekemail [email] — Validasi email
│ ${P}ceknohp [nomor]  — Validasi no HP
│ ${P}cekcc [nomor]    — Cek kartu kredit
│ ${P}cekpassword [pw] — Kekuatan password
╰──────────────────────────────

╭─「 🎲 *${sc('GENERATOR RANDOM')}* 」
│ ${P}genpassword [n]  — Generate password kuat
│ ${P}genuuid          — Generate UUID
│ ${P}pilih a, b, c    — Pilih secara random
│ ${P}shuffle a, b, c  — Acak urutan item
│ ${P}warnarandom      — Warna HEX random
│ ${P}tanggalrandom    — Tanggal random
╰──────────────────────────────

╭─「 📅 *${sc('TANGGAL & WAKTU')}* 」
│ ${P}harike [tanggal]  — Hari dalam minggu
│ ${P}sisahari [tgl]    — Hitung sisa hari
│ ${P}leapyear [tahun]  — Cek tahun kabisat
│ ${P}zodiaklahir [tgl] — Zodiak dari tgl lahir
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU')}* 」
│ ${P}qrcode [teks]     — Generate QR code
│ ${P}shorturl [link]   — Pendekkan link
│ ${P}hex2rgb / rgb2hex — Konversi kode warna
│ ${P}vigenere [key][txt] — Vigenère cipher
│ ${P}atbash [teks]     — Atbash cipher
│ ${P}tobase32/frombase32 — Base32 encode/decode
│ ${P}slugify [teks]    — Ubah jadi URL slug
│ ${P}loremipsum [n]    — Generate lorem ipsum
│ ${P}randomname        — Nama fantasi random
│ ${P}anagram [a] [b]   — Cek anagram
│ ${P}syllable [teks]   — Hitung suku kata
│ ${P}readingtime [teks]— Estimasi waktu baca
│ ${P}numeronim [kata]  — Buat numeronim
│ ${P}dogyears [umur]   — Konversi umur anjing
│ ${P}jsonvalidate/jsonformat [json] — Cek/rapikan JSON
│ ${P}regextest [pattern] [teks] — Tes regex
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #2')}* 」
│ ${P}urlencode/urldecode, htmlencode/htmldecode
│ ${P}rot47, xorcipher/xordekrip [key][teks]
│ ${P}digitalroot/collatz/perfectnumber/popcount [n]
│ ${P}binaryops [a] [and/or/xor] [b]
│ ${P}circlearea/triangleheron/rectarea/spherevolume
│ ${P}stdev/statmode [n1,n2,...]
│ ${P}compoundinterest/simpleinterest/loanpayment/roi
│ ${P}businessdays/weeknumber/quarter [tanggal]
│ ${P}levenshtein [a] | [b], passphrase [n], acronym [teks]
│ ${P}listunique/listintersect/listdiff
│ ${P}windchill/heatindex/angleconvert/cmyk2rgb
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #3')}* 」
│ ${P}railfence/railfencedekrip, caesarbrute, piglatin
│ ${P}tobase36/frombase36
│ ${P}ncr/npr [n] [r], pascalrow [n], primelist [n]
│ ${P}trapezoidarea/hexagonarea/cylindervolume
│ ${P}ibancheck/macvalidate/ipv4validate
│ ${P}pingenerate/couponcode/numbertowords
│ ${P}fueleff/cookingconvert, textanalysis [teks]
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #4 (dasar)')}* 」
│ ${P}massconvert/volumeconvert [nilai] [mode]
│ ${P}trimspaces/capitalizefirst/countchar [teks]
│ ${P}randomcolorname, ageinseconds [tgl]
│ ${P}nextweekday [hari], gcdlist/lcmlist [n1,n2,...]
│ ${P}removedupewords/strlen/isnumeric/reversenumber
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #5')}* 」
│ ${P}extractnumbers/extractemails/extracturls [teks]
│ ${P}removepunctuation/wordwrap [teks]
│ ${P}tax/taxremove/discountstack — Kalkulator harga
│ ${P}retirement [umur_skrg] [umur_pensiun]
│ ${P}bmr/idealweight/waterintake — Info kesehatan dasar
│ ${P}timeconvert [detik], numeralsystem [n][dari][ke]
│ ${P}leapyearlist/daysinmonth, zodiaccompat [z1] [z2]
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #6')}* 」
│ ${P}simplifyfraction/fractiontodecimal/decimaltofraction
│ ${P}gpacalc [n1,n2,...], romanvalidate [angka]
│ ${P}currencyformat [angka] [IDR/USD/EUR]
│ ${P}rollnotation [XdY+Z] — Dadu ala tabletop RPG
│ ${P}drawcard [n] — Kocok kartu remi
│ ${P}hashtaggen [topik]
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #7')}* 」
│ ${P}tobase58/frombase58
│ ${P}pressureconvert [nilai] [mode]
│ ${P}randomword, randomcity
│ ${P}topwords [teks] — Kata paling sering muncul
╰──────────────────────────────

╭─「 🆕 *${sc('TOOLS BARU #8 (dekorasi teks)')}* 」
│ ${P}upsidedown/zalgotext/smallcaps [teks]
│ ${P}strikethrough/underline/circledtext/fullwidth [teks]
│ ${P}hammingdistance/jaccard — Perbandingan teks/set
│ ${P}averagespeed/electricitybill
╰──────────────────────────────${buildRegistryCategoryPack('🛠️ Tools', '🛠️ Tools')}`
    );

}

// ─── MENU MEDIA ───────────────────────────────────────────────────
export async function sendMediaMenu(reply) {
    await reply(
`╔══════════════════════════════════════╗
║   🖼️  *${sc('MENU MEDIA')}*
╚══════════════════════════════════════╝

╭─「 🎵 *${sc('MUSIK YOUTUBE')}* 」
│ ${P}play <judul>   — Cari & kirim audio dari YouTube
│ _Contoh: \`${P}play Naruto opening\`_
╰──────────────────────────────

╭─「 📥 *${sc('DOWNLOAD SOSIAL MEDIA')}* 」
│ ${P}ig <link>      — Download video Instagram (reel/post)
│ ${P}tiktok <link>  — Download video TikTok
│ _Bisa juga REPLY ke pesan yang isinya link, lalu ketik command-nya_
╰──────────────────────────────

╭─「 📤 *${sc('REPOST MEDIA')}* 」
│ ${P}repost    — Kirim ulang media terakhir
│ ${P}mediainfo — Info media terakhir di chat
╰──────────────────────────────

╭─「 🎭 *${sc('STIKER')}* 」
│ ${P}sticker  — Cara membuat stiker WA
│ _Kirim gambar/video dengan caption_
│ \`${P}sticker\` untuk konversi otomatis
╰──────────────────────────────

╭─「 📸 *${sc('FOTO PROFIL')}* 」
│ ${P}pp [@tag]  — Lihat foto profil member
│ ${P}ppgrup     — Lihat foto profil grup
╰──────────────────────────────

╭─「 🟢 *${sc('BRAT & IQC')}* 」
│ ${P}brat <teks>        — Gambar teks ala "brat"
│ \`${P}iqc <teks> dark\` — Versi tema gelap
│ _Bisa juga reply pesan teks lalu ketik command-nya_
╰──────────────────────────────

╭─「 🆕 *${sc('DOWNLOADER TAMBAHAN')}* 」
│ ${P}threads, reddit, bilibili, dailymotion, vimeo, snackvideo
│ _Reply/kirim link platform terkait + command-nya_
╰──────────────────────────────

╭─「 🎛️ *${sc('EFEK MEDIA (butuh ffmpeg)')}* 」
│ ${P}grayscale / mirror / blur — Reply gambar (grayscale/mirror bisa video juga)
│ ${P}rotate90 / rotate180      — Putar gambar
│ ${P}hd                        — Upscale + pertajam foto (reply foto)
│ ${P}speedup / slowmo          — Reply video, ubah kecepatan 2x/0.5x
│ ${P}mutevideo                 — Hapus suara dari video
│ ${P}extractaudio              — Ambil audio dari video jadi mp3
│ ${P}volumeup                  — Reply voice note/audio, naikkan volume 2x
╰──────────────────────────────

╭─「 🎛️ *${sc('EFEK MEDIA #2')}* 」
│ ${P}sepia / invert / pixelate — Reply gambar
│ ${P}brighten / darken         — Atur kecerahan gambar
│ ${P}reversevideo              — Reply video, dibalik jadi mundur
│ ${P}flipvertical / square     — Flip vertikal / crop persegi
│ ${P}watermark [teks]          — Reply gambar + caption teks watermark
╰──────────────────────────────

╭─「 🤖 *${sc('AI STYLE TRANSFER')}* 」 _(baru! butuh setup)_
│ ${P}tobotak / tochibi / tofigura / toghibli
│ ${P}tohijab / tolego / tohitam / to3d
│ ${P}toroblox / tooilpainting
│ _Reply/kirim foto + command-nya_
│ ⚠️ Butuh settings.puterAuthToken diisi dulu di setting.js
│ (lihat komentar setup lengkap di situ)
╰──────────────────────────────

💡 _Fitur media terus berkembang!_
_Update bot secara berkala untuk fitur baru._${buildRegistryCategoryPack('🖼️ Media', '🖼️ Media')}`
    );

}

// ─── MENU BOT ─────────────────────────────────────────────────────
export async function sendBotMenu(reply) {
    await reply(
`╔══════════════════════════════════════╗
║   🤖  *${sc('MENU BOT — OWNER CONTROL')}*
╚══════════════════════════════════════╝

╭─「 📦 *${sc('INFO FITUR')}* 」
│ ${P}totalfitur   — Jumlah total command/fitur bot
│ ${P}allmenu      — Lihat semua command lengkap
╰──────────────────────────────

╭─「 📢 *${sc('BROADCAST')}* 」
│ ${P}broadcast [pesan]     — Kirim ke semua grup
│ ${P}broadcastuser [pesan] — Kirim ke semua user RPG
│ ${P}listgrup              — Lihat jumlah grup bot
│ _⚠️ Khusus owner saja_
╰──────────────────────────────

╭─「 🔄 *${sc('JADIBOT (MULTI-DEVICE)')}* 」
│ ${P}jadibot [628xxx]  — Pasang bot di nomor lain
│ ${P}stopbot [628xxx]  — Hentikan jadibot
│ ${P}listjadibot       — Daftar jadibot aktif
╰──────────────────────────────

╭─「 🖥️ *${sc('CPANEL — JUALAN SLOT SERVER')}* 」
│ ${P}cpanel — Menu lengkap create/kelola server Pterodactyl (v1-v5)
│ _⚠️ Isi settings.pterodactyl di setting.js dulu_
╰──────────────────────────────

╭─「 📊 *${sc('STATISTIK & SARAN')}* 」 _(baru!)_
│ ${P}botstats    — Statistik pemakaian bot
│ ${P}changelog   — Riwayat update bot
│ ${P}suggest [saran] — Kirim saran fitur ke Owner
│ ${P}listsuggestions — Lihat semua saran (Owner)
╰──────────────────────────────

╭─「 🙏 *${sc('CREDITS & SUPPORT')}* 」 _(baru!)_
│ ${P}credits    — Teknologi di balik bot ini
│ ${P}support    — Butuh bantuan? Mulai dari sini
│ ${P}backupnow  — Backup manual data bot (Owner)
│ ${P}version    — Lihat versi bot saat ini
│ ${P}delay [detik] — Atur delay balasan bot (0 = instan, Owner/Admin)
╰──────────────────────────────

╭─「 ℹ️ *${sc('CATATAN PENTING')}* 」
│ ◈ Setiap jadibot = koneksi WA terpisah
│ ◈ Max ${20} jadibot aktif bersamaan
│ ◈ Risiko ban nomor jadibot ditanggung user
│ ◈ Gunakan dengan bijak!
╰──────────────────────────────${buildRegistryCategoryPack('🤖 Bot', '🤖 Bot')}`
    );

}
