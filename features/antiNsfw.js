// ═══════════════════════════════════════════════════════════════════
//  ANTINSFW.JS — Proteksi Konten Dewasa (NSFW) — v3.2.0
//  Fitur admin: deteksi & hapus otomatis foto/video/stiker dewasa yang
//  masuk ke grup, + command manual buat admin, + sistem strike/kick.
//
//  File ini SENGAJA dibuat TERPISAH dari features/protection.js MAUPUN
//  features/protectionExtra.js (mengikuti pola yang sudah ada di project
//  ini) — supaya proteksi yang sudah terbukti jalan di kedua file itu
//  TIDAK ikut ke-utak-atik / berisiko regresi. File ini cuma meng-IMPORT
//  beberapa helper kecil yang sudah ada (satu arah, tidak circular):
//    - isWhitelisted()        dari features/protectionExtra.js
//    - getMessageContentType() dari commands/adminCommands.js
//
//  DETEKSI ASLI (bukan cuma cek nama file/caption) dikerjakan oleh
//  lib/nsfwDetector.js lewat API eksternal (default: PixLab). Fungsi di
//  file ini HANYA mengurus alur proteksi (bypass admin/whitelist, hapus
//  pesan, notifikasi, strike, auto-kick) — supaya kalau provider deteksi
//  gambar mau diganti nanti, file ini tidak perlu disentuh sama sekali.
//
//  ⚠️ PENTING — BACA INI: deteksi OTOMATIS baru aktif kalau API key sudah
//  diisi di setting.js (lihat blok `nsfwDetection`). Selama belum diisi,
//  `.antinsfw on` tetap bisa dinyalakan (tidak error), tapi deteksi
//  otomatisnya tidak akan menghapus apa pun (fail-open — lihat komentar
//  di lib/nsfwDetector.js). Command manual `.hapusnsfw` TETAP jalan
//  kapan saja tanpa butuh API key sama sekali, karena itu murni aksi
//  admin (reply lalu hapus), bukan deteksi otomatis.
// ═══════════════════════════════════════════════════════════════════

import { getGroupSettings, updateGroupSettings } from '../lib/db.js';
import { jidNum } from '../lib/utils.js';
import { log } from '../lib/logger.js';
import { isWhitelisted } from './protectionExtra.js';
import { getMessageContentType } from '../commands/adminCommands.js';
import { checkNsfwMedia } from '../lib/nsfwDetector.js';

const MEDIA_TYPES_TO_SCAN = new Set(['image', 'video', 'sticker', 'gif']);
const DEFAULT_STRIKE_LIMIT = 3;

function bypass(jid, sender, isAdmin) {
    return isAdmin || isWhitelisted(jid, sender);
}

function strikeLimitFor(jid) {
    const s = getGroupSettings(jid);
    return s.nsfwStrikeLimit || DEFAULT_STRIKE_LIMIT;
}

// ─── STRIKE COUNTER (runtime-only, sama pola seperti warnCounts di
//     commands/adminCommands.js — reset kalau bot restart, memang
//     disengaja: strike NSFW itu sifatnya "peringatan berjalan", bukan
//     catatan permanen) ─────────────────────────────────────────────────
const nsfwStrikes = new Map(); // `${jid}:${sender}` -> count
function strikeKeyOf(jid, sender) { return `${jid}:${sender}`; }

export function getNsfwStrikeCount(jid, sender) {
    return nsfwStrikes.get(strikeKeyOf(jid, sender)) || 0;
}
export function resetNsfwStrike(jid, sender) {
    nsfwStrikes.delete(strikeKeyOf(jid, sender));
}

// Menambah 1 strike & (kalau perlu) kick. Return teks hasil buat dikirim
// bot, dan flag `kicked` supaya pemanggil tahu apakah member sudah keluar.
async function bumpStrikeAndMaybeKick(sock, jid, sender) {
    const key   = strikeKeyOf(jid, sender);
    const limit = strikeLimitFor(jid);
    const count = (nsfwStrikes.get(key) || 0) + 1;

    if (count >= limit) {
        nsfwStrikes.delete(key);
        try {
            await sock.groupParticipantsUpdate(jid, [sender], 'remove');
            return { kicked: true, text: `🚨 @${jidNum(sender)} mencapai *${count}/${limit}* strike NSFW dan telah di-*KICK*!` };
        } catch (err) {
            log.error(`antiNsfw: gagal kick ${jidNum(sender)} — ${err.message}`);
            return { kicked: false, text: `🚨 @${jidNum(sender)} mencapai *${count}/${limit}* strike NSFW, tapi bot gagal kick (cek izin admin bot).` };
        }
    }
    nsfwStrikes.set(key, count);
    return { kicked: false, text: `⚠️ Strike NSFW @${jidNum(sender)}: *${count}/${limit}*. Setelah mencapai batas, member akan otomatis di-kick.` };
}

// ═══════════════════════════════════════════════════════════════════
//  DETEKSI OTOMATIS — dipanggil dari lib/messagePipeline.js untuk
//  SETIAP pesan masuk di grup (mengikuti pola seluruh proteksi lain di
//  project ini: return true kalau pesan sudah ditangani/dihapus, false
//  kalau tidak ada yang perlu dilakukan).
// ═══════════════════════════════════════════════════════════════════
export async function antiNsfw(sock, msg, jid, sender, isAdmin) {
    const s = getGroupSettings(jid);
    if (!s.antinsfw) return false;
    if (bypass(jid, sender, isAdmin)) return false;

    const type = getMessageContentType(msg);
    if (!MEDIA_TYPES_TO_SCAN.has(type)) return false;

    let buffer;
    try {
        const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
        buffer = await downloadMediaMessage(msg, 'buffer', {});
    } catch (err) {
        // Gagal download (media kedaluwarsa, koneksi putus, dll) — fail-open,
        // JANGAN hapus pesan hanya karena bot gagal mengunduhnya.
        log.error(`antiNsfw: gagal download media — ${err.message}`);
        return false;
    }

    const result = await checkNsfwMedia(buffer, type);
    if (!result.checked || !result.isNsfw) return false;

    log.protection('anti-nsfw', jidNum(sender));
    try { await sock.sendMessage(jid, { delete: msg.key }); } catch { /* ignore */ }

    const { text } = await bumpStrikeAndMaybeKick(sock, jid, sender);
    try {
        await sock.sendMessage(jid, {
            text: `🔞 *[ ANTI-NSFW AKTIF ]*\n\n@${jidNum(sender)}, konten yang kamu kirim terdeteksi mengandung unsur dewasa/eksplisit!\n❌ Media telah dihapus otomatis.\n\n${text}`,
            mentions: [sender],
        });
    } catch (err) {
        log.error(`antiNsfw notify: ${err.message}`);
    }
    return true;
}

// ═══════════════════════════════════════════════════════════════════
//  COMMAND MANUAL: .hapusnsfw — reply ke foto/video/stiker lalu admin
//  hapus paksa + kasih strike, TANPA butuh API deteksi apa pun (jadi
//  tetap berguna walau nsfwDetection belum di-setup di setting.js).
// ═══════════════════════════════════════════════════════════════════
function getQuotedMedia(ctx) {
    const ctxInfo = ctx.msg.message?.extendedTextMessage?.contextInfo;
    const quoted  = ctxInfo?.quotedMessage;
    if (!quoted || !ctxInfo?.participant) return null;

    const type = getMessageContentType({ message: quoted });
    if (!MEDIA_TYPES_TO_SCAN.has(type)) return null;

    return {
        type,
        sender: ctxInfo.participant,
        key: { remoteJid: ctx.jid, id: ctxInfo.stanzaId, participant: ctxInfo.participant, fromMe: false },
    };
}

export async function manualDeleteNsfw(ctx) {
    const { reply, jid, isAdmin, sock } = ctx;
    if (isAdmin === undefined || isAdmin === null) return reply('❌ Command ini hanya bisa digunakan di dalam *grup*!');
    if (!isAdmin) return reply('❌ Hanya *admin grup* yang bisa menggunakan command ini!');

    const target = getQuotedMedia(ctx);
    if (!target) return reply('📌 Reply foto/video/stiker yang mau dihapus, lalu ketik *.hapusnsfw*.');

    try {
        await sock.sendMessage(jid, { delete: target.key });
    } catch (err) {
        return reply(`❌ Gagal menghapus pesan itu (mungkin sudah terhapus/kedaluwarsa): ${err.message}`);
    }

    const { text } = await bumpStrikeAndMaybeKick(sock, jid, target.sender);
    await sock.sendMessage(jid, {
        text: `🔞 *[ HAPUS MANUAL — ANTI-NSFW ]*\n\n✅ Media dari @${jidNum(target.sender)} berhasil dihapus admin.\n\n${text}`,
        mentions: [target.sender],
    });
}

export async function checkNsfwStrikeCmd(ctx) {
    const { reply, jid, mentioned, sender } = ctx;
    const target = mentioned?.[0] || sender;
    const count  = getNsfwStrikeCount(jid, target);
    const limit  = strikeLimitFor(jid);
    await reply(`🔞 @${jidNum(target)} memiliki *${count}/${limit}* strike anti-NSFW.`);
}

export async function resetNsfwStrikeCmd(ctx) {
    const { reply, jid, mentioned, isAdmin } = ctx;
    if (isAdmin === undefined || isAdmin === null) return reply('❌ Command ini hanya bisa digunakan di dalam *grup*!');
    if (!isAdmin) return reply('❌ Hanya *admin grup* yang bisa menggunakan command ini!');
    if (!mentioned?.length) return reply('📌 Cara pakai: *.resetnsfwstrike @tag*');

    for (const target of mentioned) resetNsfwStrike(jid, target);
    await reply('✅ Strike anti-NSFW direset untuk member yang ditandai.');
}

export async function setNsfwStrikeLimitCmd(ctx) {
    const { reply, jid, args, isAdmin } = ctx;
    if (isAdmin === undefined || isAdmin === null) return reply('❌ Command ini hanya bisa digunakan di dalam *grup*!');
    if (!isAdmin) return reply('❌ Hanya *admin grup* yang bisa menggunakan command ini!');

    const n = parseInt(args[0]);
    if (!n || n < 1) return reply('📌 Cara pakai: *.setnsfwlimit [angka]* (default 3)');
    updateGroupSettings(jid, { nsfwStrikeLimit: n });
    await reply(`✅ Limit strike anti-NSFW diatur ke *${n}*.`);
}
