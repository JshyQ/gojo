/**
 * rule34Commands.js — .r34 / .rule34 (Rule34.xxx image search)
 *
 * API: https://api.rule34.xxx/index.php?page=dapi&s=post&q=index
 * Auth: api_key + user_id (isi di setting.js → rule34)
 *
 * Contoh:
 *   .r34 cat
 *   .rule34 1girl solo
 */

import settings from '../setting.js';
import { tagName } from '../lib/utils.js';

const PREFIX = settings.prefix || '.';
const API_BASE = 'https://api.rule34.xxx/index.php';

function getRule34Creds() {
    const cfg = settings.rule34 || {};
    const apiKey = (process.env.RULE34_API_KEY || cfg.apiKey || '').toString().trim();
    const userId = (process.env.RULE34_USER_ID || cfg.userId || '').toString().trim();
    return { apiKey, userId };
}

/**
 * Cari post di Rule34.xxx by tags.
 * @param {object} ctx - command context dari index.js
 */
export async function searchRule34(ctx) {
    const { sock, jid, msg, args, reply, sender, isGroup } = ctx;
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
    if (!userId) {
        return reply(
            `⚠️ *Rule34 belum dikonfigurasi*\n\n` +
            `Isi \`rule34.userId\` (dan \`rule34.apiKey\` jika ada) di *setting.js*, lalu restart bot.`
        );
    }

    try {
        const params = new URLSearchParams({
            page: 'dapi',
            s: 'post',
            q: 'index',
            tags: tags,
            limit: '40',
            json: '1',
            user_id: userId,
        });
        // api_key opsional di beberapa setup; kirim kalau ada
        if (apiKey) params.set('api_key', apiKey);

        const url = `${API_BASE}?${params.toString()}`;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25_000);
        let res;
        try {
            res = await fetch(url, {
                signal: ctrl.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
            });
        } finally {
            clearTimeout(timer);
        }

        if (!res.ok) {
            return reply(`❌ Gagal fetch Rule34 (HTTP ${res.status}). Cek api_key / user_id atau coba lagi.`);
        }

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            // Response kosong / HTML error page
            if (!text || text.trim() === '' || text.trim() === '[]') {
                return reply(`🔍 Tidak ditemukan post untuk tags: *${tags}*`);
            }
            return reply('❌ Response Rule34 tidak valid (bukan JSON). Cek kredensial API.');
        }

        if (!Array.isArray(data) || data.length === 0) {
            return reply(`🔍 Tidak ditemukan post untuk tags: *${tags}*\nCoba tags lain.`);
        }

        // Filter yang punya file gambar/video
        const posts = data.filter((p) => p && (p.file_url || p.sample_url));
        if (!posts.length) {
            return reply(`🔍 Tidak ada media valid untuk: *${tags}*`);
        }

        const pick = posts[Math.floor(Math.random() * posts.length)];
        const mediaUrl = pick.file_url || pick.sample_url;
        const postId = pick.id || '?';
        const score = pick.score ?? '-';
        const postTags = (pick.tags || '').toString().split(/\s+/).slice(0, 12).join(', ');
        const isVideo = /\.(mp4|webm)(\?|$)/i.test(mediaUrl);

        const caption =
            `🔞 *Rule34*\n` +
            `🏷 Tags: *${tags}*\n` +
            (postTags ? `📎 ${postTags}\n` : '') +
            `🆔 Post: ${postId} | ⭐ ${score}\n` +
            `🔗 https://rule34.xxx/index.php?page=post&s=view&id=${postId}\n` +
            `\n_Request by ${tagName(sender)}_`;

        if (isVideo) {
            await sock.sendMessage(
                jid,
                { video: { url: mediaUrl }, caption },
                { quoted: msg }
            );
        } else {
            await sock.sendMessage(
                jid,
                { image: { url: mediaUrl }, caption },
                { quoted: msg }
            );
        }
    } catch (err) {
        if (err?.name === 'AbortError') {
            return reply('⏳ Timeout: API Rule34 terlalu lama merespons. Coba lagi.');
        }
        console.error('[searchRule34]', err?.message || err);
        return reply('❌ Gagal mencari di Rule34. Coba lagi nanti.');
    }
}
