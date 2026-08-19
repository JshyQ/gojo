// ═══════════════════════════════════════════════════════════════════
//  PROTECTION.JS — Sistem Proteksi Grup
//  Anti-GB · Anti-Link · Anti-ShortLink · Anti-Spam
//  Anti-Toxic · Anti-Flood · Welcome · Farewell
// ═══════════════════════════════════════════════════════════════════

import { getGroupSettings } from '../lib/db.js';
import { jidNum, withTimeout } from '../lib/utils.js';
import { recallRealJid } from '../lib/lidMapping.js';
import { log } from '../lib/logger.js';
import settings from '../setting.js';
// v3.1.0: dua helper kecil dari protectionExtra.js (custom bad-word &
// link allowlist per-grup) — arah dependency SATU ARAH, protectionExtra.js
// TIDAK import apapun balik dari file ini, jadi tidak circular.
import { getCustomBadWords, isLinkAllowed } from './protectionExtra.js';

// ─── PATTERN DEFINITIONS ──────────────────────────────────────────

const GROUP_LINK_PATTERNS = [
    /chat\.whatsapp\.com\/[a-zA-Z0-9]+/i,
    /whatsapp\.com\/channel\/[a-zA-Z0-9]+/i,
    /wa\.me\/[a-zA-Z0-9]{15,}/i,
];

const SHORTENER_PATTERNS = [
    /bit\.ly\/[^\s]+/i,
    /tinyurl\.com\/[^\s]+/i,
    /s\.id\/[^\s]+/i,
    /cutt\.ly\/[^\s]+/i,
    /lynk\.id\/[^\s]+/i,
    /gg\.gg\/[^\s]+/i,
    /rb\.gy\/[^\s]+/i,
    /shorturl\.at\/[^\s]+/i,
];

const GENERIC_LINK_PATTERNS = [
    /https?:\/\/[^\s]+/i,
    /www\.[^\s]+\.[a-z]{2,}/i,
    /wa\.me\/[^\s]+/i,
];

const TOXIC_WORDS = new Set([
    'anjing','bangsat','kontol','memek','tolol','goblok','bego','idiot',
    'asu','babi','jancok','bajingan','kampret','sialan','tai','taik',
    'kimak','cibai','pantek','pukimak','setan','iblis','bedebah',
    ...(settings.extraToxicWords || []),
]);

// Pesan notifikasi proteksi — lebih variatif & menarik
const WARN_MSGS = {
    gb: (num) =>
`🛡️ *[ ANTI-GB AKTIF ]*

@${num} dilarang mengirim link undangan grup lain!
❌ Pesan telah dihapus secara otomatis.

_Pelanggaran berulang = kick!_`,

    link: (num) =>
`🔗 *[ ANTI-LINK AKTIF ]*

@${num} dilarang mengirim link di grup ini!
❌ Pesan telah dihapus secara otomatis.

_Hubungi admin jika butuh izin._`,

    shortlink: (num) =>
`📎 *[ ANTI-SHORTLINK AKTIF ]*

@${num} dilarang mengirim link pemendek URL!
_(bit.ly, tinyurl, s.id, dll)_
❌ Pesan telah dihapus.`,

    spam: (num) =>
`🚫 *[ ANTI-SPAM AKTIF ]*

@${num} terdeteksi spam!
Pesan selanjutnya akan otomatis dihapus.

_Tunggu beberapa detik sebelum kirim pesan lagi._`,

    toxic: (num, word) =>
`⚠️ *[ ANTI-TOXIC AKTIF ]*

@${num} menggunakan kata tidak sopan${word ? ` ("${word}")` : ''}!
❌ Pesan telah dihapus.

_Jaga etika & kesopanan di grup ini ya~ 🙏_`,

    flood: (num) =>
`🌊 *[ ANTI-FLOOD AKTIF ]*

@${num} mengirim terlalu banyak pesan sekaligus!
❌ Pesan berlebih dihapus otomatis.`,
};

// ─── SPAM TRACKER (in-memory) ─────────────────────────────────────

const spamTracker = new Map();
const SPAM_WINDOW = settings.spamWindowMs   || 10_000;
const SPAM_MAX    = settings.spamMaxMessages || 6;

// ─── FLOOD TRACKER (lebih agresif dari spam) ──────────────────────

const floodTracker = new Map();
const FLOOD_WINDOW = 3_000;  // 3 detik
const FLOOD_MAX    = 4;      // 4 pesan dalam 3 detik = flood

// ─── HELPER: cek admin ────────────────────────────────────────────

async function isGroupAdmin(sock, jid, sender) {
    try {
        // FIX: withTimeout agar tidak hang saat rate-limited
        const meta = await withTimeout(sock.groupMetadata(jid), 15_000, 'groupMetadata(protection)');
        // FIX @lid: p.id di groupMetadata bisa @lid sementara sender @s.whatsapp.net
        const p = meta.participants.find(x => {
            if (x.id === sender) return true;
            if (x.id.includes('@lid')) { const r = recallRealJid(x.id); if (r && r === sender) return true; }
            if (sender.includes('@lid')) { const r = recallRealJid(sender); if (r && r === x.id) return true; }
            return false;
        });
        return p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch {
        return false;
    }
}

// ─── HELPER: kirim notifikasi & hapus pesan ──────────────────────

async function deleteAndNotify(sock, msg, jid, sender, text) {
    try {
        await sock.sendMessage(jid, { delete: msg.key });
    } catch { /* ignore */ }
    try {
        await sock.sendMessage(jid, {
            text,
            mentions: [sender],
        });
    } catch (err) {
        log.error(`Protection notify: ${err.message}`);
    }
}

// ─── ANTI-GB ──────────────────────────────────────────────────────

export async function antiGB(sock, msg, jid, sender, body) {
    const s = getGroupSettings(jid);
    if (!s.antigb) return false;
    if (await isGroupAdmin(sock, jid, sender)) return false;
    if (!GROUP_LINK_PATTERNS.some(p => p.test(body))) return false;

    log.protection('anti-gb', jidNum(sender));
    const num = jidNum(sender);
    await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.gb(num));
    return true;
}

// ─── ANTI-SHORTLINK ───────────────────────────────────────────────

export async function antiShortLink(sock, msg, jid, sender, body) {
    const s = getGroupSettings(jid);
    if (!s.antishortlink) return false;
    if (await isGroupAdmin(sock, jid, sender)) return false;
    if (!SHORTENER_PATTERNS.some(p => p.test(body))) return false;

    log.protection('anti-shortlink', jidNum(sender));
    await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.shortlink(jidNum(sender)));
    return true;
}

// ─── ANTI-LINK ────────────────────────────────────────────────────

export async function antiLink(sock, msg, jid, sender, body) {
    const s = getGroupSettings(jid);
    if (!s.antilink) return false;
    if (await isGroupAdmin(sock, jid, sender)) return false;
    if (!GENERIC_LINK_PATTERNS.some(p => p.test(body))) return false;
    // v3.1.0: domain yang di-whitelist admin lewat .allowlinkadd lolos dari antilink
    if (isLinkAllowed(jid, body)) return false;

    log.protection('anti-link', jidNum(sender));
    await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.link(jidNum(sender)));
    return true;
}

// ─── ANTI-SPAM ────────────────────────────────────────────────────

export async function antiSpam(sock, msg, jid, sender) {
    const s = getGroupSettings(jid);
    if (!s.antispam) return false;
    if (await isGroupAdmin(sock, jid, sender)) return false;

    if (!spamTracker.has(jid)) spamTracker.set(jid, new Map());
    const groupMap = spamTracker.get(jid);
    const now      = Date.now();
    const entry    = groupMap.get(sender) || { count: 0, windowStart: now };

    if (now - entry.windowStart > SPAM_WINDOW) {
        entry.count = 1;
        entry.windowStart = now;
    } else {
        entry.count++;
    }
    groupMap.set(sender, entry);

    if (entry.count > SPAM_MAX) {
        try { await sock.sendMessage(jid, { delete: msg.key }); } catch {}
        if (entry.count === SPAM_MAX + 1) {
            log.protection('anti-spam', jidNum(sender));
            await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.spam(jidNum(sender)));
        }
        return true;
    }
    return false;
}

// ─── ANTI-FLOOD (lebih agresif) ───────────────────────────────────

export async function antiFlood(sock, msg, jid, sender) {
    const s = getGroupSettings(jid);
    if (!s.antispam) return false; // Pakai toggle yang sama dengan antispam
    if (await isGroupAdmin(sock, jid, sender)) return false;

    if (!floodTracker.has(jid)) floodTracker.set(jid, new Map());
    const groupMap = floodTracker.get(jid);
    const now      = Date.now();
    const entry    = groupMap.get(sender) || { count: 0, windowStart: now };

    if (now - entry.windowStart > FLOOD_WINDOW) {
        entry.count = 1;
        entry.windowStart = now;
    } else {
        entry.count++;
    }
    groupMap.set(sender, entry);

    if (entry.count > FLOOD_MAX) {
        try { await sock.sendMessage(jid, { delete: msg.key }); } catch {}
        if (entry.count === FLOOD_MAX + 1) {
            log.protection('anti-flood', jidNum(sender));
            await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.flood(jidNum(sender)));
        }
        return true;
    }
    return false;
}

// ─── ANTI-TOXIC ───────────────────────────────────────────────────

export async function antiToxic(sock, msg, jid, sender, body) {
    const s = getGroupSettings(jid);
    if (!s.antitoxic) return false;
    if (await isGroupAdmin(sock, jid, sender)) return false;

    const lower  = body.toLowerCase();
    // v3.1.0: gabungkan kata custom yang ditambah admin lewat .addbadword
    // (per-grup, runtime, tersimpan di features/protectionExtra.js)
    const found  = [...TOXIC_WORDS, ...getCustomBadWords(jid)].find(w => lower.includes(w));
    if (!found) return false;

    log.protection('anti-toxic', jidNum(sender));
    await deleteAndNotify(sock, msg, jid, sender, WARN_MSGS.toxic(jidNum(sender), found));
    return true;
}

// ─── WELCOME / FAREWELL ───────────────────────────────────────────

export async function sendWelcome(sock, jid, participants) {
    const s = getGroupSettings(jid);
    if (!s.welcome) return;

    let meta = null;
    try { meta = await sock.groupMetadata(jid); } catch {}
    const groupName = meta?.subject || 'Grup ini';

    for (const user of participants) {
        const num = jidNum(user);
        // FIX (rebranding V2): .setwelcome mendokumentasikan placeholder
        // {user} untuk mention, tapi sebelumnya di sini cuma {name} yang
        // dibaca — akibatnya tag member baru TIDAK muncul kalau admin
        // ikut instruksi resmi. Sekarang {user} & {name} sama-sama valid
        // (alias), dan pakai regex global /g supaya SEMUA kemunculan
        // placeholder di teks ke-replace, bukan cuma yang pertama.
        const text = s.welcomeText
            ? s.welcomeText
                .replace(/\{user\}/g, `@${num}`)
                .replace(/\{name\}/g, `@${num}`)
                .replace(/\{group\}/g, groupName)
                .replace(/\{num\}/g, num)
            : `👋 *Selamat datang di ${groupName}!*\n\n` +
              `Halo @${num}! Senang kamu bergabung~ 🎉\n\n` +
              `📌 Baca deskripsi grup & patuhi peraturan ya!`;

        try {
            await sock.sendMessage(jid, {
                text,
                mentions: [user],
            });
        } catch (err) {
            log.error(`Welcome: ${err.message}`);
        }
    }
}

export async function sendFarewell(sock, jid, participants) {
    const s = getGroupSettings(jid);
    if (!s.farewell) return;

    let meta = null;
    try { meta = await sock.groupMetadata(jid); } catch {}
    const groupName = meta?.subject || 'Grup ini';

    for (const user of participants) {
        const num = jidNum(user);
        const text = s.farewellText
            ? s.farewellText
                .replace(/\{user\}/g, `@${num}`)
                .replace(/\{name\}/g, `@${num}`)
                .replace(/\{group\}/g, groupName)
                .replace(/\{num\}/g, num)
            : `👋 *Sampai jumpa!*\n\n` +
              `@${num} telah meninggalkan ${groupName}.\n` +
              `_Semoga sukses di mana pun berada!_ 🙏`;

        try {
            await sock.sendMessage(jid, {
                text,
                mentions: [user],
            });
        } catch (err) {
            log.error(`Farewell: ${err.message}`);
        }
    }
}
