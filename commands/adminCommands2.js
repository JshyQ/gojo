import { updateGroupSettings, store, save } from '../lib/db.js';
import { jidNum } from '../lib/utils.js';

function isAdminCheck(isAdmin, reply) {
    if (!isAdmin) {
        reply('❌ Hanya admin grup yang bisa menggunakan perintah ini!');
        return false;
    }
    return true;
}

// Simple per-group note/rules storage
function getGroupExtra(jid) {
    const extras = store('groupExtras');
    if (!extras[jid]) {
        extras[jid] = { rules: null, notes: [], polls: [], banned: [] };
        save('groupExtras');
    }
    return extras[jid];
}
function saveExtra(jid) {
    save('groupExtras');
}

export const adminCommands2 = {
    // ─── RULES ────────────────────────────────────────────────────────────
    async setRules(reply, jid, args, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const text = args.join(' ');
        if (!text) return reply('📌 !setrules [teks aturan grup]');
        const extra = getGroupExtra(jid);
        extra.rules = text;
        saveExtra(jid);
        await reply('✅ Aturan grup berhasil disimpan.');
    },

    async showRules(reply, jid) {
        const extra = getGroupExtra(jid);
        await reply(extra.rules ? `📋 *ATURAN GRUP*\n\n${extra.rules}` : '❌ Grup ini belum mengatur aturan. Admin bisa pakai *!setrules*.');
    },

    // ─── NOTES (sticky info admin bisa simpan) ─────────────────────────────
    async addNote(reply, jid, args, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const text = args.join(' ');
        if (!text) return reply('📌 !addnote [teks]');
        const extra = getGroupExtra(jid);
        extra.notes.push({ text, ts: Date.now() });
        saveExtra(jid);
        await reply(`✅ Note ditambahkan (#${extra.notes.length}).`);
    },

    async listNotes(reply, jid) {
        const extra = getGroupExtra(jid);
        if (!extra.notes.length) return reply('📝 Belum ada note tersimpan.');
        const lines = extra.notes.map((n, i) => `${i + 1}. ${n.text}`).join('\n');
        await reply(`📝 *NOTES GRUP*\n\n${lines}`);
    },

    async deleteNote(reply, jid, args, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const idx = parseInt(args?.[0]) - 1;
        const extra = getGroupExtra(jid);
        if (isNaN(idx) || !extra.notes[idx]) return reply('📌 !delnote [nomor]');
        extra.notes.splice(idx, 1);
        saveExtra(jid);
        await reply('✅ Note dihapus.');
    },

    // ─── SIMPLE POLLS (text-based, manual tally) ──────────────────────────
    async createPoll(sock, reply, jid, msg, args) {
        const text = args.join(' ');
        if (!text) return reply('📌 !poll [pertanyaan]\nMember bisa vote dengan reply angka 1/2.');
        try {
            await sock.sendMessage(jid, {
                poll: { name: text, values: ['Setuju', 'Tidak Setuju'], selectableCount: 1 },
            });
        } catch {
            await reply(`📊 *POLLING*\n\n${text}\n\n1️⃣ Setuju\n2️⃣ Tidak Setuju\n\n(Balas dengan angka pilihanmu)`);
        }
    },

    // ─── ANTI-DELETE NOTICE ────────────────────────────────────────────────
    async antidelete(reply, jid, args, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const status = (args[0] || '').toLowerCase();
        updateGroupSettings(jid, { antidelete: status === 'on' });
        await reply(status === 'on'
            ? '✅ Anti-delete diaktifkan. Bot akan mencoba memberi tahu jika ada pesan yang dihapus pengirim (tergantung dukungan platform).'
            : '❌ Anti-delete dinonaktifkan.');
    },

    // ─── GROUP STATISTIC ────────────────────────────────────────────────────
    async groupActivity(sock, reply, jid) {
        try {
            const metadata = await sock.groupMetadata(jid);
            const admins = metadata.participants.filter(p => p.admin).length;
            await reply(`📊 *STATISTIK GRUP*\n\n👥 Total member: ${metadata.participants.length}\n👑 Admin: ${admins}\n📛 Nama: ${metadata.subject}\n🆔 ID: ${jid}`);
        } catch {
            await reply('❌ Gagal mengambil statistik grup.');
        }
    },

    // ─── BLOCK / UNBLOCK (bot-level, not whatsapp-level) ───────────────────
    async banUser(reply, jid, mentioned, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        if (!mentioned?.[0]) return reply('📌 !ban @tag — blokir penggunaan bot untuk user ini di grup.');
        const extra = getGroupExtra(jid);
        if (!extra.banned.includes(mentioned[0])) extra.banned.push(mentioned[0]);
        saveExtra(jid);
        await reply(`🚫 @${jidNum(mentioned[0])} diblokir dari menggunakan bot di grup ini.`);
    },

    async unbanUser(reply, jid, mentioned, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        if (!mentioned?.[0]) return reply('📌 !unban @tag');
        const extra = getGroupExtra(jid);
        extra.banned = extra.banned.filter(id => id !== mentioned[0]);
        saveExtra(jid);
        await reply(`✅ @${jidNum(mentioned[0])} dibuka blokirnya.`);
    },

    isBanned(jid, sender) {
        const extra = getGroupExtra(jid);
        return extra.banned.includes(sender);
    },

    // ─── v3.1.0: lihat & bersihkan daftar blokir sekaligus ─────────────────
    async listBanned(reply, jid) {
        const extra = getGroupExtra(jid);
        if (!extra.banned.length) return reply('✅ Tidak ada user yang diblokir dari bot di grup ini.');
        const lines = extra.banned.map((id, i) => `${i + 1}. @${jidNum(id)}`).join('\n');
        await reply(`🚫 *DAFTAR BLOKIR BOT*\n━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━\n💡 Kalau user ini keluar lalu coba gabung lagi, bot akan otomatis mengeluarkannya lagi selama masih ada di daftar ini.`);
    },

    async unbanAll(reply, jid, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const extra = getGroupExtra(jid);
        const total = extra.banned.length;
        extra.banned = [];
        saveExtra(jid);
        await reply(total ? `✅ ${total} user berhasil dibuka blokirnya sekaligus.` : '✅ Tidak ada user yang diblokir untuk dibuka.');
    },

    // ─── AUTO-RESPONSE CONFIG ───────────────────────────────────────────────
    async setAutoReply(reply, jid, args, isAdmin) {
        if (!isAdminCheck(isAdmin, reply)) return;
        const [trigger, ...replyParts] = args;
        const replyText = replyParts.join(' ');
        if (!trigger || !replyText) return reply('📌 !autoreply [trigger] [balasan]');

        const extra = getGroupExtra(jid);
        if (!extra.autoReplies) extra.autoReplies = {};
        extra.autoReplies[trigger.toLowerCase()] = replyText;
        saveExtra(jid);
        await reply(`✅ Auto-reply untuk "${trigger}" berhasil diatur.`);
    },

    async listAutoReply(reply, jid) {
        const extra = getGroupExtra(jid);
        const entries = Object.entries(extra.autoReplies || {});
        if (!entries.length) return reply('📝 Belum ada auto-reply yang diatur.');
        const lines = entries.map(([k, v]) => `• "${k}" → ${v}`).join('\n');
        await reply(`🤖 *AUTO-REPLY LIST*\n\n${lines}`);
    },

    checkAutoReply(jid, body) {
        const extra = getGroupExtra(jid);
        const entries = Object.entries(extra.autoReplies || {});
        const lower = body.toLowerCase();
        const match = entries.find(([k]) => lower.includes(k));
        return match ? match[1] : null;
    },
};
