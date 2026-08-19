// ═══════════════════════════════════════════════════════════════════
//  MESSAGEPIPELINE.JS — Pemrosesan Pesan Masuk
//  + Auto-Read, Auto-Typing, Cooldown System, Better Logging
// ═══════════════════════════════════════════════════════════════════

import { isJidGroup } from '@whiskeysockets/baileys';
import { handleCommand, checkMute, commandExists } from '../commands/index.js';
import { adminCommands2 } from '../commands/adminCommands2.js';
import { checkSlowmode, checkContentLock } from '../commands/adminCommands.js';
import { antiGB, antiLink, antiShortLink, antiSpam, antiToxic, antiFlood } from '../features/protection.js';
import {
    antiLinkPhishing, antiJudol, antiPinjol,
    antiCaps, antiVirtex, antiTagSpam, checkMemberMute,
} from '../features/protectionExtra.js';
import { antiNsfw } from '../features/antiNsfw.js';
import { trackMedia } from '../commands/mediaCommands.js';
import { checkCooldown, setCooldown, cooldownMsg } from './cooldown.js';
import { log } from './logger.js';
import settings from '../setting.js';
import { withTimeout, resolveSenderJid } from './utils.js';
import { recallRealJid } from './lidMapping.js';
import { getReplyDelayOverride } from './replyDelay.js';
import { getGroupMetadata } from './groupMetaCache.js';
import { isOwner, isCreator } from './roles.js';
import { trackActivity, isMaintenanceMode } from '../commands/adminCommands6.js';
import { markActive } from './siderTracker.js';
import { resolveMenuShortcut } from './menuShortcut.js';
import { handleAutoFeatures } from './autoFeatures.js';
import { shouldBlockDmChat } from '../features/antiCallChat.js';
import { handleGojoAiChat } from './gojoAi.js';

const PREFIX = settings.prefix || '.';

// ─── HELPER: Ekstrak ID dari balasan Native Flow (tombol interaktif) ──
// Saat user mengetuk baris di menu interaktif (single_select), WhatsApp
// TIDAK mengirim balik teks biasa. Yang masuk adalah message berjenis
// interactiveResponseMessage, dengan payload JSON di dalam string
// nativeFlowResponseMessage.paramsJson — bentuknya kira-kira:
//   { "id": ".menurpg" }
// Fungsi ini mem-parse JSON tersebut dan mengembalikan field "id"-nya,
// supaya bisa diperlakukan sama seperti user mengetik ".menurpg" manual.
function extractNativeFlowId(msg) {
    try {
        const paramsJson = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if (!paramsJson) return '';
        const parsed = JSON.parse(paramsJson);
        return parsed?.id || '';
    } catch {
        return '';
    }
}

// ─── HELPER: Auto-read ───────────────────────────────────────────
async function autoRead(sock, msg) {
    if (!settings.autoRead) return;
    try {
        await withTimeout(sock.readMessages([msg.key]), 10_000, 'readMessages');
    } catch { /* ignore */ }
}

// ─── HELPER: Auto-typing ─────────────────────────────────────────
// v3.1.2: delay dikembalikan lagi — kali ini FIXED di rentang 3-4 detik
// (acak sedikit di antaranya, bukan angka yang sama persis tiap kali),
// dibaca dari settings.typingDurationMin/Max di setting.js. Bot akan
// kirim indikator "mengetik..." lalu betul-betul menunggu sebelum lanjut
// ke balasan command.
// .delay [detik] — override manual buat delay balasan bot, diatur
// Owner/Creator (command-nya ada di commands/index.js, logic simpan di
// lib/replyDelay.js). 0 = instan (skip typing indicator sekalian).
// null = belum diatur -> pakai typingDurationMin/Max acak seperti biasa.
async function autoTyping(sock, jid) {
    if (!settings.autoTyping) return;
    const override = getReplyDelayOverride();
    if (override === 0) return; // instan — skip typing indicator sama sekali
    try {
        await withTimeout(sock.sendPresenceUpdate('composing', jid), 10_000, 'sendPresenceUpdate(composing)');
        let ms;
        if (override !== null) {
            ms = override * 1000;
        } else {
            const min = settings.typingDurationMin ?? 3000;
            const max = Math.max(min, settings.typingDurationMax ?? 4000);
            ms = min + Math.floor(Math.random() * (max - min + 1));
        }
        await new Promise(r => setTimeout(r, ms));
        await withTimeout(sock.sendPresenceUpdate('paused', jid), 10_000, 'sendPresenceUpdate(paused)');
    } catch { /* ignore */ }
}

// ─── OWNER CHECK ─────────────────────────────────────────────────
// (fungsi isOwner sekarang diimport dari roles.js — mendukung Creator
// hardcoded + banyak Owner dinamis, bukan cuma satu nomor statis)

// ─── DEDUP PESAN MASUK ─────────────────────────────────────────────
// FIX (2026-08-06, root cause kemungkinan besar thumbnail "gak konsisten"
// pas testing di self-chat "Message yourself"): dari log console user,
// SATU pengiriman ".menu" ternyata tercatat masuk & diproses LENGKAP DUA
// KALI — dua baris "📩 [DM]" + "⚡ → .menu" persis di detik yang sama,
// PAS bersamaan dengan sesi Signal yang lagi "Closing session"/dirotasi.
// Ini kemungkinan besar quirk multi-device WhatsApp saat kirim pesan ke
// NOMOR SENDIRI (self-chat): pesan yang sama bisa tersinkron balik lewat
// lebih dari satu jalur pengiriman ke device yang sama. Efeknya: DUA
// eksekusi sendMainMenu() (atau command apapun) jalan nyaris BERBARENGAN
// untuk satu input yang sama — termasuk dua kali kirim gambar & dua kali
// kirim pesan tombol ke JID yang sama nyaris bersamaan, yang bisa saling
// tabrakan/rebutan (apalagi kalau pas bertepatan sesi Signal lagi ditutup
// ulang seperti terlihat di log). Command yang idempoten (mis. .ping)
// tidak akan kelihatan masalahnya kalau dijalankan 2x — tapi command yang
// kirim media/efek samping bisa kena race condition yang membingungkan
// persis seperti kasus ini.
// FIX: setiap message ID yang sudah diproses dicatat sebentar (10 detik).
// Kalau ID yang SAMA (dari JID yang sama) masuk lagi dalam rentang itu,
// dianggap duplikat pengiriman dan dilewati total SEBELUM masuk ke logic
// command apapun di bawah — jadi cuma diproses SEKALI, seperti seharusnya.
const recentMessageIds = new Map(); // `${jid}:${id}` -> waktu diproses (ms)
const DEDUP_WINDOW_MS = 10_000;

function isDuplicateMessage(jid, id) {
    if (!id) return false; // tidak ada ID buat dicek -> proses seperti biasa
    const key = `${jid}:${id}`;
    const now = Date.now();
    for (const [k, t] of recentMessageIds) {
        if (now - t > DEDUP_WINDOW_MS) recentMessageIds.delete(k); // bersihkan entri lama sekalian
    }
    if (recentMessageIds.has(key)) return true;
    recentMessageIds.set(key, now);
    return false;
}

// ─── MAIN PIPELINE ───────────────────────────────────────────────
export async function processIncomingMessage(sock, msg) {
    if (!msg.message) return;

    if (isDuplicateMessage(msg.key.remoteJid, msg.key.id)) {
        log?.debug?.(`[dedup] pesan duplikat dilewati (ID sudah diproses <10 detik lalu): ${msg.key.id}`);
        return;
    }


    const jid     = msg.key.remoteJid;
    const isGroup = isJidGroup(jid);
    const body    =
        msg.message?.conversation                                          ||
        msg.message?.extendedTextMessage?.text                             ||
        msg.message?.imageMessage?.caption                                 ||
        msg.message?.videoMessage?.caption                                 ||
        msg.message?.buttonsResponseMessage?.selectedButtonId              ||
        msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
        extractNativeFlowId(msg)                                           ||
        '';

    // Pesan fromMe: hanya proses kalau itu command (diawali prefix)
    // Ini mencegah infinite loop tapi tetap izinkan owner jalankan command
    if (msg.key.fromMe && !body.startsWith(PREFIX)) return;

    // FIX BUG @lid: sebelumnya sender = msg.key.remoteJid mentah, yang bisa
    // berupa identitas @lid (BUKAN nomor HP asli, dan bisa tidak konsisten
    // antar pesan dari orang yang sama). Sekarang pakai resolveSenderJid()
    // yang mencoba field nomor HP asli dari Baileys (participantPn/senderPn)
    // dulu sebelum jatuh ke JID mentah. Lihat komentar lengkap di utils.js.
    //
    // FIX TAMBAHAN — self-chat (Owner/Creator chat ke nomor bot sendiri):
    // kalau fromMe true, pesan ini SUDAH PASTI berasal dari akun yang login
    // ke bot ini sendiri — tidak perlu (dan tidak boleh) ditebak dari
    // remoteJid/LID sama sekali. Dua alasan:
    //   1) Di self-chat, remoteJid = nomor bot sendiri, dan WhatsApp kadang
    //      menyajikannya sebagai @lid (ID internal acak, BUKAN nomor HP
    //      asli) — resolveSenderJid()/isOwner()/isCreator() bisa gagal
    //      cocok padahal jelas itu Owner/Creator kirim ke dirinya sendiri.
    //   2) Kalau suatu saat balasan bot ke ORANG LAIN kebetulan diawali
    //      prefix (lolos filter fromMe di atas), remoteJid saat itu adalah
    //      nomor orang lain itu, bukan nomor bot — resolveSenderJid() akan
    //      salah total kalau tetap dipakai di sini.
    // sock.user.id adalah sumber kebenaran langsung dari Baileys tentang
    // akun yang sedang login (bukan tebakan dari isi pesan), jadi dipakai
    // langsung setiap kali fromMe true. Device suffix ":xx" (format multi-
    // device, mis. "6281234567890:31@s.whatsapp.net") sengaja dibuang dulu
    // sebelum dirangkai ulang jadi JID bersih — kalau tidak, digit device-id
    // itu ikut ke-strip jadi angka oleh normalizeNumber() di roles.js dan
    // mengotori nomor HP asli.
    const rawSelfId   = sock.user?.id || '';
    const botOwnNumber = rawSelfId.split('@')[0].split(':')[0];
    const sender = (msg.key.fromMe && botOwnNumber)
        ? `${botOwnNumber}@s.whatsapp.net`
        : (isGroup ? resolveSenderJid(msg, true) : resolveSenderJid(msg, false));

    if (!body) return;

    // Self-mode: hanya owner yang bisa pakai bot
    if (settings.selfMode && !isOwner(sender)) return;

    const num     = (sender || '').split('@')[0];
    const chatTag = isGroup ? '[GRP]' : '[DM] ';

    // Shortcut angka: kalau user baru lihat .menu lalu balas "1".."7" saja,
    // perlakukan sama seperti mengetik command lengkapnya (mis. ".menurpg").
    const shortcutCmd  = resolveMenuShortcut(sender, body);
    const effectiveBody = shortcutCmd || body;

    const isCmd   = effectiveBody.startsWith(PREFIX);

    // Log pesan masuk
    if (settings.logMessages) {
        log.msg(chatTag, num, body);
    }

    // Auto-read & auto-typing (per-chat setting, diatur via .autoread/.autotyping)
    // FIX PERFORMA: sebelumnya di-await — pipeline nunggu readMessages()/
    // sendPresenceUpdate() (network call ke WhatsApp) selesai dulu sebelum
    // lanjut. Tidak ada langkah di bawah ini yang butuh hasil dari fungsi
    // ini, jadi sekarang dilepas (fire-and-forget) — jalan di background,
    // tidak ikut menambah waktu tunggu sebelum balasan command diproses.
    handleAutoFeatures(sock, msg, jid).catch(() => {});

    trackMedia(jid, msg);

    // ── Catat aktivitas untuk fitur .sider ──────────────────────────
    // Dicatat di SINI (sebelum proteksi/cooldown/dsb) supaya SEMUA jenis
    // pesan grup (chat biasa ATAUPUN command) dihitung "aktif" — bukan
    // cuma yang lolos semua filter di bawah. Tujuannya supaya member yang
    // emang aktif chat tidak salah ke-deteksi sebagai sider gara-gara,
    // misalnya, pesannya kena anti-spam atau lagi di-mute.
    if (isGroup) {
        try { markActive(jid, sender); } catch { /* ignore */ }
    }

    // ── Status admin (hanya grup) ──────────────────────────────────
    // FIX PERFORMA: sebelumnya SELALU sock.groupMetadata(jid) fresh ke
    // WhatsApp di SETIAP pesan grup — network round-trip ini nambah
    // ratusan ms sampai 1 detik+ ke waktu balas bot, bahkan waktu
    // .delay sudah diset 0 (karena ini terjadi SEBELUM autoTyping,
    // .delay cuma ngatur bagian typing-nya saja). Sekarang pakai
    // getGroupMetadata() dari lib/groupMetaCache.js — cache 5 menit
    // yang SAMA dipakai Baileys sendiri, jadi kalau cache masih ada,
    // ini nyaris instan tanpa network call sama sekali. Cache otomatis
    // ke-refresh tiap ada event groups.update, jadi perubahan admin
    // tetap ke-detect, cuma delay-nya maksimal beberapa menit (atau
    // instan kalau memang ada event group update-nya).
    let isAdmin = false;
    if (isGroup) {
        try {
            const meta = await withTimeout(getGroupMetadata(sock, jid), 15_000, 'groupMetadata');
            // FIX @lid: p.id di groupMetadata bisa @lid sementara sender sudah
            // di-resolve ke @s.whatsapp.net — strict === selalu false → isAdmin false.
            const participant = meta.participants.find(p => {
                if (p.id === sender) return true;
                if (p.id.includes('@lid')) { const r = recallRealJid(p.id); if (r && r === sender) return true; }
                if (sender.includes('@lid')) { const r = recallRealJid(sender); if (r && r === p.id) return true; }
                return false;
            });
            isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
        } catch { /* bukan admin jika metadata gagal */ }
    }


    // ── Proteksi grup ─────────────────────────────────────────────
    if (isGroup) {
        const blocked =
            (await antiGB(sock, msg, jid, sender, body))                    ||
            (await antiLink(sock, msg, jid, sender, body))                   ||
            (await antiShortLink(sock, msg, jid, sender, body))              ||
            // v3.1.0: proteksi tambahan — lihat features/protectionExtra.js
            (await antiLinkPhishing(sock, msg, jid, sender, body, isAdmin))  ||
            (await antiSpam(sock, msg, jid, sender))                         ||
            (await antiFlood(sock, msg, jid, sender))                        ||
            (await antiToxic(sock, msg, jid, sender, body))                  ||
            (await antiJudol(sock, msg, jid, sender, body, isAdmin))         ||
            (await antiPinjol(sock, msg, jid, sender, body, isAdmin))        ||
            (await antiCaps(sock, msg, jid, sender, body, isAdmin))          ||
            (await antiVirtex(sock, msg, jid, sender, body, isAdmin))        ||
            (await antiTagSpam(sock, msg, jid, sender, isAdmin))             ||
            (await checkMute(sock, msg, jid, sender, isAdmin))               ||
            (await checkMemberMute(sock, msg, jid, sender, isAdmin))         ||
            (await checkSlowmode(sock, msg, jid, sender))                    ||
            (await checkContentLock(sock, msg, jid, sender, isAdmin))        ||
            // v3.2.0: anti-NSFW — sengaja ditaruh PALING TERAKHIR di rantai
            // ini, karena satu-satunya pengecekan di atas yang mungkin
            // memanggil API eksternal (lihat features/antiNsfw.js) — kalau
            // pesan sudah ke-blokir oleh proteksi lain yang lebih murah di
            // atas, pengecekan NSFW tidak perlu dijalankan sama sekali.
            (await antiNsfw(sock, msg, jid, sender, isAdmin));

        if (blocked) return;

        // Activity tracker (.topactive / .listinactive) — catat SETIAP
        // pesan grup yang lolos proteksi, command maupun chat biasa.
        try { trackActivity(jid, sender); } catch { /* ignore */ }

        // Blokir user yang di-ban
        if (isCmd && adminCommands2.isBanned(jid, sender)) return;

        // Auto-reply (non-command)
        if (!isCmd) {
            const ar = adminCommands2.checkAutoReply(jid, body);
            if (ar) {
                try { await sock.sendMessage(jid, { text: ar }, { quoted: msg }); } catch {}
            }
        }
    }

    // ── Proses command ────────────────────────────────────────────
    if (!isCmd) {
        // Anti-Chat: kalau di-ON-kan, DM dari selain Owner/Creator/Premium
        // di-skip dari auto-chat AI (command yang diawali prefix tetap
        // jalan seperti biasa — lihat features/antiCallChat.js).
        if (!isGroup && await shouldBlockDmChat(sock, jid, sender)) return;

        // Mode chat AI ala Gojo (.gojoai on/off) — di DM selalu boleh,
        // di grup cuma kalau bot di-mention/di-reply. Lihat lib/gojoAi.js.
        await handleGojoAiChat(sock, msg, jid, body, isGroup);
        return;
    }

    const parts   = effectiveBody.slice(PREFIX.length).trim().split(/ +/);
    const command = parts.shift().toLowerCase();
    const args    = parts;

    // ── Maintenance mode (.maintenancemode on/off) ──────────────────
    // Kalau aktif, cuma Owner/Creator yang boleh pakai command lain di
    // grup ini — dikecualikan command togglenya sendiri, supaya admin
    // tetap bisa matikan lagi mode ini tanpa perlu Owner/Creator.
    if (isGroup && command !== 'maintenancemode' && isMaintenanceMode(jid) && !isOwner(sender) && !isCreator(sender)) {
        return;
    }

    // (FIX 2026-08-01: gate "wajib .daftar sebelum pakai command lain" yang
    // dulu ada di sini sudah DIHAPUS per permintaan — semua user sekarang
    // bisa langsung pakai command apapun tanpa perlu daftar dulu. Command
    // `.daftar` & sistem karakter RPG-nya sendiri TETAP ada/tidak dihapus —
    // cuma sudah tidak lagi jadi syarat wajib buat pakai fitur non-RPG.
    // Command RPG yang butuh karakter tetap akan minta daftar sendiri kalau
    // dipanggil tanpa karakter, lihat masing-masing handler di rpgCommands*.)

    // ── Log command ───────────────────────────────────────────────
    if (settings.logCommands) {
        log.cmd(num, `.${command}`, args);
    }

    // ── Cooldown check (owner bypass jika dikonfigurasi) ──────────
    const ownerSkipCd = settings.ownerBypassCooldown && isOwner(sender);
    if (!ownerSkipCd) {
        const remaining = checkCooldown(sender, command);
        if (remaining > 0) {
            log.cooldown(num, command, (remaining / 1000).toFixed(1));
            try {
                await sock.sendMessage(jid, { text: cooldownMsg(command, remaining) }, { quoted: msg });
            } catch {}
            return;
        }
    }

    // ── Reaksi ⏳ = "lagi diproses" ─────────────────────────────────
    // FIX: dikirim DI SINI — paling awal setelah dipastikan command ini
    // akan benar-benar dieksekusi (lolos cooldown) — SEBELUM autoTyping's
    // delay 3-4 detik. Sebelumnya reaksi ini dikirim di dalam
    // handleCommand() (commands/index.js), yaitu SETELAH autoTyping,
    // sehingga user harus nunggu 3-4 detik dulu baru lihat emoji jam-nya
    // muncul. Sekarang muncul instan begitu command diterima.
    //
    // FIX BUG: dibungkus commandExists(command) — command yang TIDAK
    // terdaftar (typo, dsb, misal ".1 kali 2 berapa" -> command="1")
    // sebelumnya tetap dapat reaksi ⏳ di sini, padahal handleCommand()
    // akan return lebih awal (command tidak ada di routeMap) SEBELUM
    // sempat kirim reaksi ✅/❌ — hasilnya ⏳ nyangkut selamanya di pesan
    // itu. Sekarang command tak dikenal tidak dapat reaksi apapun sama
    // sekali (konsisten dengan perilaku lama: command tak dikenal memang
    // tidak pernah dapat balasan apapun).
    // FIX PERFORMA: sebelumnya di-await — pipeline nunggu WhatsApp konfirmasi
    // reaksi ⏳ terkirim dulu (network round-trip) SEBELUM mulai autoTyping
    // & proses command-nya sendiri. Reaksi ini cuma indikator visual "lagi
    // diproses", bukan sesuatu yang harus selesai duluan — jadi sekarang
    // dilepas (fire-and-forget), jalan bersamaan/di background sementara
    // command-nya langsung diproses, bukan berurutan nunggu ini kelar dulu.
    if (commandExists(command)) {
        sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } }).catch(() => {});
    }

    // ── Typing indicator ──────────────────────────────────────────
    await autoTyping(sock, jid);

    // ── Set cooldown SEBELUM execute (mencegah double-trigger) ────
    setCooldown(sender, command);

    // ── Execute command ───────────────────────────────────────────
    await handleCommand(
        sock, msg, jid, sender,
        command, args,
        isGroup, body,
        isGroup ? isAdmin : undefined
    );
}
