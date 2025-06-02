const { makeWASocket, downloadMediaMessage } = require('baileys');
const P = require('pino');
const QRCode = require('qrcode');
const { useSQLiteAuthState } = require('session');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { tmpdir } = require('os');

async function start() {
  const { state, saveCreds, deleteCreds, autoDeleteOldData } = await useSQLiteAuthState('session.db', 5 * 60 * 60 * 1000);

  const client = makeWASocket({
    auth: state,
    logger: P(),
    qrTimeout: 30000,
  });

  client.ev.on('connection.update', async (session) => {
    if (session.qr) {
      console.log(await QRCode.toString(session.qr, { type: "terminal", small: true }));
    }
    if (session.reason === 401) {
      await deleteCreds();
      throw new Error('Device Logout');
    }
  });

  client.ev.on('creds.update', saveCreds);

  setInterval(async () => {
    await autoDeleteOldData();
  }, 1 * 60 * 60 * 1000);

  client.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    const text = msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption || '';
    if (text.trim() !== '/botipdf') return


    const docMsg = msg.message?.documentWithCaptionMessage?.message?.documentMessage;
    console.log(docMsg);
    if (!docMsg || docMsg.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      await client.sendMessage(msg.key.remoteJid, { text: '❌ Kirim perintah /botipdf bersama file .docx ya!' });
      return;
    }

    try {
      await client.sendMessage(msg.key.remoteJid, { text: '⏳ Sabar cika sedang memproses dokumen...' });
      const buffer = await downloadMediaMessage(msg, 'buffer');
      const fileName = docMsg.fileName || 'file.docx';
      const tempInput = path.join(tmpdir(), fileName);
      const tempOutputDir = tmpdir();

      fs.writeFileSync(tempInput, buffer);

      function convertDocxToPdf(inputPath, outputDir) {
        return new Promise((resolve, reject) => {
          const command = `soffice --headless --convert-to pdf "${inputPath}" --outdir "${outputDir}"`;
          exec(command, (error, stdout, stderr) => {
            if (error) return reject(error);
            resolve(stdout);
          });
        });
      }

      await convertDocxToPdf(tempInput, tempOutputDir);

      const tempOutput = tempInput.replace(/\.docx$/i, '.pdf');
      const pdfBuffer = fs.readFileSync(tempOutput);

      await client.sendMessage(msg.key.remoteJid, {
        document: pdfBuffer,
        fileName: fileName.replace(/\.docx$/i, '.pdf'),
        mimetype: 'application/pdf',
      });

      // Hapus file sementara
      try {
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
      } catch (e) {
        console.warn('Gagal hapus file sementara:', e);
      }
    } catch (e) {
      console.error('Terjadi kesalahan saat konversi:', e);
      await client.sendMessage(msg.key.remoteJid, { text: '❌ Terjadi kesalahan saat memproses dokumen.' });
    }
  });
}

start();
