/**
 * rule34Commands.js — .r34 / .rule34 (Rule34.xxx image search)
 *
 * API: https://api.rule34.xxx/index.php?page=dapi&s=post&q=index
 * Auth: api_key + user_id (isi di setting.js → rule34)
 *
 * FIX: jangan kirim { image: { url } } langsung ke CDN Rule34 —
 * server WhatsApp sering gagal unduh (hotlink / block). Unduh buffer
 * dulu, baru kirim sebagai media buffer.
 *
 * Contoh:
 *   .r34 cat
 *   .rule34 1girl solo
 */

import settings from '../setting.js';
import { tagName } from '../lib/utils.js';

const PREFIX = settings.prefix || '.';
const API_BASE = 'https://api.rule34.xxx/index.php';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function getRule34Creds() {
    const cfg = settings.rule34 || {};
    const apiKey = (process.env.RULE34_API_KEY || cfg.apiKey || '').toString().trim();
    const userId = (process.env.RULE34_USER_ID || cfg.userId || '').toString().trim();
    return { apiKey, userId };
}

async function fetchJson(url, timeoutMs = 25_000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: {
                'User-Agent': UA,
                'Accept': 'application/json,text/plain,*/*',
            },
        });
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
    } finally {
        clearTimeout(timer);
    }
}

async function downloadBuffer(url, timeoutMs = 45_000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: {
                'User-Agent': UA,
                'Accept': 'image/*,video/*,*/*',
                'Referer': 'https://rule34.xxx/',
            },
            redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} saat unduh media`);
        const ab = await res.arrayBuffer();
        const buf = Buffer.from(ab);
        if (!buf.length) throw new Error('Media kosong (0 byte)');
        // WhatsApp image limit ~16MB; jaga-jaga
        if (buf.length > 15 * 1024 * 1024) throw new Error('File terlalu besar untuk WhatsApp');
        const ctype = (res.headers.get('content-type') || '').toLowerCase();
        return { buf, ctype };
    } finally {
        clearTimeout(timer);
    }
}

function pickMediaUrl(post) {
    // Prefer sample (lebih kecil, jarang gagal) lalu file_url, lalu preview
    const candidates = [post.sample_url, post.file_url, post.preview_url].filter(Boolean);
    return candidates[0] || null;
}

function isVideoUrl(url, ctype = '') {
    if (ctype.startsWith('video/')) return true;
    return /\.(mp4|webm)(\?|$)/i.test(url || '');
}

/**
 * Cari post di Rule34.xxx by tags.
 * @param {object} ctx - command context dari index.js
 */
export async function searchRule34(ctx) {
    const { sock, jid, msg, args, reply, sender } = ctx;
    const tags = (args || []).join(' ').trim();

    if (!tags) {
        return reply(
            `🔞 *Rule34 Search*\n\n` +
            `Cara pakai:\n` +
            `• \`${PREFIX}r34 <tags>\`\n` +
            `• \`${PREFIX}rule34 <tags>\`\n\n` +
            `Contoh:\n` +
            `• \`${PREFIX}r34 cat\`\n` +
            `• \`${PREFIX}r34 1girl solo\`\n` +
            `• \`${PREFIX}rule34 blue_eyes long_hair\`\n\n` +
            `_Tags pakai underscore, spasi = AND._\n` +
            `_Konten 18+ — gunakan dengan bijak._`
        );
    }

    const { apiKey, userId } = getRule34Creds();
    if (!userId || !apiKey) {
        return reply(
            `⚠️ *Rule34 belum dikonfigurasi lengkap*\n\n` +
            `Isi \`rule34.apiKey\` dan \`rule34.userId\` di *setting.js*, lalu restart bot.\n` +
            `Status: apiKey=${apiKey ? 'OK' : 'KOSONG'} | userId=${userId || 'KOSONG'}`
        );
    }

    try {
        const params = new URLSearchParams({
            page: 'dapi',
            s: 'post',
            q: 'index',
            tags,
            limit: '40',
            json: '1',
            api_key: apiKey,
            user_id: userId,
        });

        const url = `${API_BASE}?${params.toString()}`;
        const { ok, status, text } = await fetchJson(url);

        if (!ok) {
            return reply(
                `❌ Gagal fetch Rule34 (HTTP ${status}).\n` +
                `Cek api_key / user_id di setting.js, atau coba lagi nanti.`
            );
        }

        // Auth error kadang 200 dengan string plain
        if (/missing authentication/i.test(text)) {
            return reply(
                `❌ *Autentikasi Rule34 gagal*\n\n` +
                `API key / user_id tidak valid. Generate key baru di rule34.xxx → Options.`
            );
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            if (!text || text.trim() === '' || text.trim() === '[]') {
                return reply(`🔍 Tidak ditemukan post untuk tags: *${tags}*`);
            }
            return reply(
                `❌ Response Rule34 tidak valid (bukan JSON).\n` +
                `Cuplikan: ${text.slice(0, 120)}`
            );
        }

        if (!Array.isArray(data) || data.length === 0) {
            return reply(`🔍 Tidak ditemukan post untuk tags: *${tags}*\nCoba tags lain.`);
        }

        const posts = data.filter((p) => p && (p.file_url || p.sample_url || p.preview_url));
        if (!posts.length) {
            return reply(`🔍 Tidak ada media valid untuk: *${tags}*`);
        }

        // Coba beberapa post kalau unduhan gagal
        const shuffled = [...posts].sort(() => Math.random() - 0.5);
        const tries = shuffled.slice(0, 5);
        let lastErr = null;

        for (const pick of tries) {
            const mediaUrl = pickMediaUrl(pick);
            if (!mediaUrl) continue;

            try {
                const { buf, ctype } = await downloadBuffer(mediaUrl);
                const postId = pick.id || '?';
                const score = pick.score ?? '-';
                const postTags = (pick.tags || '').toString().split(/\s+/).slice(0, 12).join(', ');
                const caption =
                    `🔞 *Rule34*\n` +
                    `🏷 Tags: *${tags}*\n` +
                    (postTags ? `📎 ${postTags}\n` : '') +
                    `🆔 Post: ${postId} | ⭐ ${score}\n` +
                    `🔗 https://rule34.xxx/index.php?page=post&s=view&id=${postId}\n` +
                    `\n_Request by ${tagName(sender)}_`;

                if (isVideoUrl(mediaUrl, ctype)) {
                    await sock.sendMessage(
                        jid,
                        { video: buf, caption, mimetype: ctype.startsWith('video/') ? ctype : 'video/mp4' },
                        { quoted: msg }
                    );
                } else {
                    await sock.sendMessage(
                        jid,
                        { image: buf, caption },
                        { quoted: msg }
                    );
                }
                return; // sukses
            } catch (e) {
                lastErr = e;
                console.error('[searchRule34] media fail:', mediaUrl, e?.message || e);
            }
        }

        return reply(
            `❌ Gagal mengirim media Rule34.\n` +
            `Alasan: ${lastErr?.message || 'unduh/kirim gagal'}\n` +
            `Coba tags lain atau ulangi sebentar lagi.`
        );
    } catch (err) {
        if (err?.name === 'AbortError') {
            return reply('⏳ Timeout: API Rule34 terlalu lama merespons. Coba lagi.');
        }
        console.error('[searchRule34]', err?.message || err);
        return reply(`❌ Gagal mencari di Rule34.\n${err?.message || 'Unknown error'}`);
    }
}
