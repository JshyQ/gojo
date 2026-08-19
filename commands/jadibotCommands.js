// ─── JADIBOT COMMANDS ──────────────────────────────────────────────────────

import {
    startChildBot,
    stopChildBot,
    isAlreadyChildBot,
    countActiveChildBots,
    listChildBotNumbers,
    getChildBotStatus,
} from '../lib/childBot.js';

export const jadibotCommands = {

    async startJadibot(reply, sender, args) {
        // Kalau user tidak kasih nomor → pakai nomor sender sendiri (multi-device)
        const number = (args[0] || sender || '').replace(/[^0-9]/g, '');
        if (!number) {
            return reply(
                `📌 *Cara pakai .jadibot*\n\n` +
                `Cukup ketik *.jadibot* — bot akan minta kamu memasukkan pairing code di nomormu sendiri.\n` +
                `Atau: *.jadibot 628xxxxxxxxxx* untuk nomor lain.\n\n` +
                `> ℹ️ Setelah terhubung, nomor itu bisa pakai SEMUA fitur bot ini.`
            );
        }

        if (isAlreadyChildBot(number)) {
            return reply(
                `⚠️ Nomor +${number} sudah punya sesi jadibot aktif.\n` +
                `Gunakan *.stopbot ${number}* dulu kalau ingin mengulang.`
            );
        }

        await reply(
            `⏳ *Menyiapkan jadibot untuk +${number}...*\n` +
            `📊 Slot aktif: ${countActiveChildBots()}/20\n\n` +
            `Pairing code akan dikirim dalam ~5 detik. Tunggu sebentar!`
        );

        try {
            const { processIncomingMessage } = await import('../lib/messagePipeline.js');

            await startChildBot(number, {
                onPairingCode: (code) => {
                    reply(
                        `╔══════════════════════════╗\n` +
                        `║  🔑  PAIRING CODE JADIBOT  ║\n` +
                        `╚══════════════════════════╝\n\n` +
                        `\`\`\`${code}\`\`\`\n\n` +
                        `📲 *Cara memasukkan kode:*\n` +
                        `1. Buka WhatsApp di HP nomor *+${number}*\n` +
                        `2. Ketuk ⋮ → *Perangkat Tertaut*\n` +
                        `3. Ketuk *Tautkan Perangkat*\n` +
                        `4. Pilih *Tautkan dengan Nomor Telepon*\n` +
                        `5. Masukkan kode di atas\n\n` +
                        `> ⏱️ Kode berlaku ±60 detik, segera masukkan!\n` +
                        `> 🔒 Jangan bagikan kode ini ke siapapun.`
                    );
                },
                onStatus: (status, message) => {
                    if (status === 'connected')    reply(`✅ *Jadibot +${number} berhasil terhubung!*\nSemua fitur bot aktif di nomor tersebut.\n\n> Ketik *.stopbot* untuk menghentikan.`);
                    if (status === 'reconnecting') reply(`🔄 Jadibot +${number} reconnecting... ${message}`);
                    if (status === 'loggedout')    reply(`❌ Jadibot +${number} logout/berhenti: ${message}`);
                    if (status === 'error')        reply(`❌ Gagal menjalankan jadibot +${number}:\n${message}`);
                },
                mainHandleMessage: processIncomingMessage,
            });
        } catch (err) {
            await reply(`❌ Gagal memulai jadibot: ${err.message}`);
        }
    },

    async stopJadibot(reply, sender, args, isOwner) {
        // Default: hentikan jadibot milik sender sendiri
        const callerNum = (sender || '').split('@')[0];
        const number    = (args[0] || callerNum || '').replace(/[^0-9]/g, '');

        if (!number) return reply('📌 Cara pakai: *.stopbot 628xxxxxxxxxx*');

        // Keamanan: hanya owner bot ATAU pemilik nomor itu sendiri
        if (!isOwner && callerNum !== number) {
            return reply('❌ Kamu hanya bisa menghentikan jadibot milikmu sendiri.');
        }

        const stopped = await stopChildBot(number, true);
        await reply(stopped
            ? `✅ Jadibot +${number} berhasil dihentikan dan sesi dihapus.`
            : `ℹ️ Tidak ada sesi jadibot aktif untuk nomor +${number}.`
        );
    },

    async listJadibot(reply, isOwner) {
        if (!isOwner) return reply('❌ Command ini hanya untuk owner bot.');
        const numbers = listChildBotNumbers();
        if (!numbers.length) return reply('📋 Tidak ada jadibot yang aktif saat ini.');

        const lines = numbers.map(n => {
            const s = getChildBotStatus(n);
            const uptime = s?.startedAt ? Math.floor((Date.now() - s.startedAt) / 60000) : '?';
            return `• +${n} — ${s?.status || '?'} (${uptime} menit)`;
        }).join('\n');

        await reply(`📋 *JADIBOT AKTIF (${numbers.length}/20)*\n\n${lines}`);
    },
};
