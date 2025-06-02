// const { Component } = require('@neoxr/wb')
// const { Baileys, Function: Func, Config: env } = new Component

// const waSocket = new Baileys({
    //    type: '--neoxr-v1',
    //    plugsdir: 'plugins',
    //    session: 'github:neoxr/session#sqlite',
    //    online: true,
//    bypass_disappearing: true,
//    version: [2, 3000, 1017531287],
//    bot: id => {
    //       // Detect message from bot by message ID, you can add another logic here
//       return (id.startsWith('3EB0') && id.length === 40) || id.startsWith('BAE') || /[-]/.test(id)
//    },
//    version: [2, 3000, 1023389224] // To see the latest version : https://wppconnect.io/whatsapp-versions/
// }, {
    //    shouldIgnoreJid: jid => {
        //       return /(newsletter|bot)/.test(jid)
        //    }
        // })
const {makeWASocket } = require('baileys')
const P = require('pino');
const QRCode = require('qrcode');
const { useSQLiteAuthState } = require('session')

async function start() {
    const { state, saveCreds, deleteCreds, autoDeleteOldData } = await useSQLiteAuthState('session.db', 5 * 60 * 60 * 1000) // set maxAge default 24 hours, but this example is 5 hours
    
    const client = makeWASocket({
       auth:state,
       logger:P(),
       qrTimeout: 30000,
    })
    
    client.ev.on('connection.update', async (session) => {
        if (session.qr) {
            console.log(await QRCode.toString(session.qr, { type: "terminal", small: true }));
        }
       if (session.reason === 401) {
          await deleteCreds()
          throw new Error('Device Logout')
       }
    })
    
    client.ev.on('creds.update', saveCreds)
    
    
    setInterval(async () => {
        await autoDeleteOldData()
    }, 1 * 60 * 60 * 1000) // checking every 1 hour




const kataKasar = [
  'anjing', 'anjg', 'anjng', 'anj1ng', 'a**jing', 'p',
  'babi', 'b4bi', 'bab1', 'b@bi', 'b@b1',
  'bangsat', 'bangs4t', 'bangsattt', 'bangs*t',
  'kontol', 'kntol', 'kontl', 'k0ntol', 'k0ntl', 'k*ntol',
  'memek', 'mem3k', 'm3mek', 'm3m3k', 'me*ek',
  'pepek', 'pep3k', 'p3pek', 'p3p3k',
  'cuki', 'cuk', 'cuk1', 'c*k', 'cuq',
  'ngentot', 'ngentod', 'ngntot', 'ng3ntot', 'nge*tod',
  'tolol', 't0lol', 't*l*l',
  'goblok', 'g0blok', 'g*blok', 'gblk',
  'tai', 'taik', 'tae', 't@i',
  'setan', 's3tan', 's3t@n',
  'kampret', 'kamvret', 'k4mpret', 'kamp*et',
  'kimak', 'kima', 'kim4k', 'k1mak', 'k1m4k',
  'idiot', 'id10t', '1diot',
  'bodoh', 'b*doh', 'bod0h',
  'bacot', 'b4cot', 'bac0t', 'bac*t'
]
    
    client.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const msg = messages[0]
        
        const groupId = msg.key.remoteJid
        const sender = msg.key.participant
        if (groupId.endsWith('@g.us')) {
            console.log('Group ID:', groupId)
        }
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
        // Cek kata kasar
        if (kataKasar.some(kata => text.toLowerCase().includes(kata))) {
            await client.sendMessage(groupId, {
                delete: {
                    remoteJid: groupId,
                    fromMe: false,
                    id: msg.key.id,
                    participant: msg.key.participant || msg.participant
                  }               
            })
            try {
                await client.groupParticipantsUpdate(groupId, [sender], 'remove')
            } catch (e) {
                console.error('Gagal mengeluarkan member:', e)
            }
        }
    })
 }
 start()

