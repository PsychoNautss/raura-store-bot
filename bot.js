// Raura Store Bot — RED THEME (semua embed berwarna merah di garis kiri)
// Copy–paste file ini menjadi C:/raura-store-bot/src/bot.js
// Pastikan .env sudah berisi: BOT_TOKEN, GUILD_ID, ADMIN_ROLE_ID, MARKET_ACCESS_ROLE_ID, ORDER_LOG_CHANNEL_ID (opsional)

import 'dotenv/config'
import {
  Client, GatewayIntentBits, Partials, REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType
} from 'discord.js'

// ================= CONFIG =================
const CONFIG = {
  guildId: process.env.GUILD_ID,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  marketAccessRoleId: process.env.MARKET_ACCESS_ROLE_ID,
  orderLogChannelId: process.env.ORDER_LOG_CHANNEL_ID || '',

  // >>> TEMA MERAH: gunakan warna merah untuk semua embed
  colors: { accent: 0xFF0000, panel: 0xFF0000 },

  // (opsional) URL banner gambar
  images: { 
    paymentBanner: 'https://media.discordapp.net/attachments/1408130596500279397/1409522154818764982/instagram_feed.png?ex=68cab04d&is=68c95ecd&hm=abd671483fca656f2cb5c1daa2906b25c0f44ce01385f9a7b2025043fbe8747a&=&format=webp&quality=lossless&width=960&height=960', 
    priceBeforeBanner: 'https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856', 
    priceAfterBanner: 'https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856', 
    giftBanner: 'https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856', 
    instantBanner: 'https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856',
    loginBanner: 'https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856'
  },

  rates: { 
    gamepass_before_tax_delay: 85, 
    gamepass_after_tax_delay: 120, 
    gift_gamepass_instant: 95, 
    instant_payout: 135,
    via_login: 150
  },

  giftSupportedGames: [
    'Anime Vanguard','Arise Crossover','Basketball Zero','Bluelock Rivals','Bloxfruits','Bloxburg',
    'Bubble Gum Simulator Indonesia','Car Driving Indonesia','Dress to Impress','Expedition Antartica',
    'Fisch','Grow a Garden','Rivals',"Sol's RnG",'Steal a Brain Rot','The Strongest Battlegrounds','Volleyball Legends'
  ],

  payments: {
    intro: 'Untuk saat ini Raura Store hanya mensupport payment method di bawah ini:',
    legend: '🟢 = Available.\n🔴 = Unavailable.\nThank you for shopping!',
    buttons: {
      mandiri: { label: 'Mandiri', available: true, message: 'Pembayaran via **Mandiri** — nomor rekening akan diberikan setelah order.' },
      bca: { label: 'BCA', available: true, message: 'Pembayaran via **BCA** — nomor rekening akan diberikan setelah order.' },
      gopay: { label: 'Gopay', available: true, message: 'Pembayaran via **Gopay** — kirim bukti transfer setelah order.' },
      seabank: { label: 'Seabank', available: true, message: 'Pembayaran via **Seabank** — nomor rekening akan diberikan setelah order.' },
      qris: { label: 'QRIS', available: false, message: 'Pembayaran via **QRIS** — QR akan diberikan setelah order.' }
    }
  }
}

const isAdmin = (m) => m?.permissions?.has(PermissionFlagsBits.Administrator) || m?.roles?.cache?.has(CONFIG.adminRoleId)

// ================ CLIENT ================
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers], partials: [Partials.GuildMember] })

const commands = [
  new SlashCommandBuilder().setName('setup').setDescription('Kirim panel verif/payment/price (admin only)')
    .addStringOption(o=>o.setName('panel').setDescription('verify | payment | robux | gift_gamepass | instant_payout | vilog | price_all').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder().setName('calc').setDescription('Hitung harga Robux ↔ Rupiah')
    .addIntegerOption(o=>o.setName('robux').setDescription('Jumlah Robux (isi salah satu)'))
    .addIntegerOption(o=>o.setName('rupiah').setDescription('Jumlah Rupiah (isi salah satu)'))
    .addIntegerOption(o=>o.setName('rate').setDescription('Override rate (opsional)')),
  new SlashCommandBuilder().setName('order').setDescription('Buka form order Robux'),
  new SlashCommandBuilder().setName('format').setDescription('Tampilkan format order untuk metode via login'),
  new SlashCommandBuilder().setName('qris').setDescription('Tampilkan QR Code untuk pembayaran QRIS'),
  new SlashCommandBuilder().setName('group').setDescription('Informasi Group Community Roblox'),
  new SlashCommandBuilder().setName('fishit').setDescription('Link server Fisch untuk join'),
  new SlashCommandBuilder().setName('chat').setDescription('Kirim pesan ke channel (admin only)')
    .addStringOption(o=>o.setName('message').setDescription('Pesan yang ingin dikirim').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder().setName('rates').setDescription('Lihat/ubah rate')
    .addSubcommand(s=>s.setName('show').setDescription('Tampilkan rate sekarang'))
    .addSubcommand(s=>s.setName('set').setDescription('Ubah rate (admin only)')
      .addStringOption(o=>o.setName('jenis').setDescription('before_tax | after_tax | gift | instant | login').setRequired(true))
      .addIntegerOption(o=>o.setName('nilai').setDescription('Nilai rate baru').setRequired(true)))
]

client.once('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)
  await rest.put(Routes.applicationGuildCommands(client.application.id, CONFIG.guildId), { body: commands.map(c=>c.toJSON()) })
  console.log(`✅ Logged in as ${client.user.tag}`)
})

// ============== PANELS & EMBEDS (Merah) ==============
const code = (a)=>'```'+a.join('\n')+'```'
const red = CONFIG.colors.panel

const embedVerify = ()=> new EmbedBuilder().setColor(red).setTitle('Market Access')
  .setDescription('Klik tombol **Verify** untuk mendapatkan role **@MEMBER**').setFooter({ text: 'Raura Store' })
const rowVerify   = ()=> new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verify_grant').setLabel('Verify ✅').setStyle(ButtonStyle.Success))

const embedPayment = ()=>{ const e=new EmbedBuilder().setColor(red).setTitle('PAYMENT METHODS')
  .setDescription(`${CONFIG.payments.intro}\n\n${CONFIG.payments.legend}`); if(CONFIG.images.paymentBanner) e.setImage(CONFIG.images.paymentBanner); return e }
const rowPayment = ()=>{ const b=CONFIG.payments.buttons; return new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('pay_mandiri').setLabel(b.mandiri.label).setStyle(b.mandiri.available?ButtonStyle.Success:ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('pay_bca').setLabel(b.bca.label).setStyle(b.bca.available?ButtonStyle.Success:ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('pay_gopay').setLabel(b.gopay.label).setStyle(b.gopay.available?ButtonStyle.Success:ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('pay_seabank').setLabel(b.seabank.label).setStyle(b.seabank.available?ButtonStyle.Success:ButtonStyle.Danger),
  new ButtonBuilder().setCustomId('pay_qris').setLabel(b.qris.label).setStyle(b.qris.available?ButtonStyle.Success:ButtonStyle.Danger)) }

const embedRobux = ()=>{ 
  const rBefore = CONFIG.rates.gamepass_before_tax_delay
  const rAfter = CONFIG.rates.gamepass_after_tax_delay
  const listBefore = [[100],[200],[300],[400],[500],[1000],[1500],[2000],[5000]]
    .map(([n])=>`${n} Robux = Rp ${(n*rBefore).toLocaleString('id-ID')}`)
  const listAfter = [[100],[200],[300],[400],[500],[1000],[1500],[2000],[5000]]
    .map(([n])=>`${n} Robux = Rp ${(n*rAfter).toLocaleString('id-ID')}`)
  
  const combinedText = `**ROBUX BEFORE TAX VIA GAMEPASS DELAY 5–7 HARI (RATE ${rBefore})**\n${code(listBefore)}\n**ROBUX AFTER TAX VIA GAMEPASS DELAY 5–7 HARI (RATE ${rAfter})**\n${code(listAfter)}`
  
  const e = new EmbedBuilder().setColor(red)
    .setDescription(combinedText)
  
  if(CONFIG.images.priceBeforeBanner) e.setImage(CONFIG.images.priceBeforeBanner)
  return e 
}
const embedGift = ()=>{ const r=CONFIG.rates.gift_gamepass_instant; const e=new EmbedBuilder().setColor(red)
  .setTitle(`ROBUX GIFT GAMEPASS INSTANT (RATE ${r})`).setDescription(code(CONFIG.giftSupportedGames.map(g=>`- ${g}`)))
  .addFields({ name:'Catatan', value:`Hitung total: jumlah Robux × ${r}. Contoh: 1460 × ${r} = Rp ${(1460*r).toLocaleString('id-ID')}` }); if(CONFIG.images.giftBanner) e.setImage(CONFIG.images.giftBanner); return e }
const embedInstant = ()=>{ const r=CONFIG.rates.instant_payout; const list=[[500],[1000],[1500],[2000],[5000]]
  .map(([n])=>`${n} Robux = Rp ${(n*r).toLocaleString('id-ID')}`); const e=new EmbedBuilder().setColor(red)
  .setTitle(`ROBUX INSTANT PAYOUT (RATE ${r})`).setDescription(code(list)); if(CONFIG.images.instantBanner) e.setImage(CONFIG.images.instantBanner); return e }
const embedLogin = ()=>{ const r=CONFIG.rates.via_login; const list=[[500],[1000],[1500],[2000],[2500],[3000],[3500],[4000],[4500],[5000]]
  .map(([n])=>`${n} Robux = Rp ${(n*r).toLocaleString('id-ID')}`); const e=new EmbedBuilder().setColor(red)
  .setTitle(`ROBUX VIA LOGIN (RATE ${r})`).setDescription(code(list)); if(CONFIG.images.loginBanner) e.setImage(CONFIG.images.loginBanner); return e }

// ============== INTERACTIONS ==============
client.on('interactionCreate', async (i)=>{
  try{
    if(i.isChatInputCommand()){
      if(i.commandName==='setup'){
        if(!isAdmin(i.member)) return i.reply({ content:'Kamu tidak punya izin.', ephemeral:true })
        const panel=i.options.getString('panel',true)
        if(panel==='verify'){ await i.channel.send({ embeds:[embedVerify()], components:[rowVerify()] }); return i.reply({ content:'✅ Panel Verify terkirim.', ephemeral:true }) }
        if(panel==='payment'){ await i.channel.send({ embeds:[embedPayment()], components:[rowPayment()] }); return i.reply({ content:'✅ Panel Payment terkirim.', ephemeral:true }) }
        if(panel==='robux'){ await i.channel.send({ embeds:[embedRobux()] }); return i.reply({ content:'✅ Panel Robux (Before & After Tax) terkirim.', ephemeral:true }) }
        if(panel==='gift_gamepass'){ await i.channel.send({ embeds:[embedGift()] }); return i.reply({ content:'✅ Panel Gift Gamepass terkirim.', ephemeral:true }) }
        if(panel==='instant_payout'){ await i.channel.send({ embeds:[embedInstant()] }); return i.reply({ content:'✅ Panel Instant Payout terkirim.', ephemeral:true }) }
        if(panel==='vilog'){ await i.channel.send({ embeds:[embedLogin()] }); return i.reply({ content:'✅ Panel Via Login terkirim.', ephemeral:true }) }
        if(panel==='price_all'){
          await i.channel.send({ embeds:[embedRobux()] })
          await i.channel.send({ embeds:[embedGift()] })
          await i.channel.send({ embeds:[embedInstant()] })
          await i.channel.send({ embeds:[embedLogin()] })
          return i.reply({ content:'✅ Semua price panel terkirim.', ephemeral:true })
        }
        return i.reply({ content:'Panel tidak dikenal.', ephemeral:true })
      }

      if(i.commandName==='calc'){
        const robux=i.options.getInteger('robux'); const rupiah=i.options.getInteger('rupiah'); const rate=i.options.getInteger('rate')??CONFIG.rates.gift_gamepass_instant
        if((robux&&rupiah)||(!robux&&!rupiah)) return i.reply({ content:'Isi **salah satu**: `robux` **atau** `rupiah`.', ephemeral:true })
        if(robux) return i.reply({ content:`${robux.toLocaleString('id-ID')} Robux × ${rate} = **Rp ${(robux*rate).toLocaleString('id-ID')}**` })
        const rb=Math.floor(rupiah/rate); return i.reply({ content:`Rp ${rupiah.toLocaleString('id-ID')} ÷ ${rate} ≈ **${rb.toLocaleString('id-ID')} Robux**` })
      }

      if(i.commandName==='order'){
        const modal=new ModalBuilder().setCustomId('order_modal').setTitle('Form Order Robux')
        const m=new TextInputBuilder().setCustomId('m').setLabel('Metode (MANDIRI/BCA/Gopay/QRIS)').setStyle(TextInputStyle.Short).setRequired(true)
        const a=new TextInputBuilder().setCustomId('a').setLabel('Jumlah Robux').setStyle(TextInputStyle.Short).setRequired(true)
        const c=new TextInputBuilder().setCustomId('c').setLabel('ID Roblox / kontak').setStyle(TextInputStyle.Short).setRequired(true)
        modal.addComponents(new ActionRowBuilder().addComponents(m), new ActionRowBuilder().addComponents(a), new ActionRowBuilder().addComponents(c))
        return i.showModal(modal)
      }

      if(i.commandName==='format'){
        const formatText = `Username/Email      : \nPassword            : \nOrder               :\nKode Backup(3 kode) : `
        const embed = new EmbedBuilder()
          .setColor(red)
          .setTitle('Format Order')
          .setDescription('```\n' + formatText + '\n```')
          .addFields({ 
            name: '📝 Cara ambil kode backup', 
            value: 'Roblox Setting/pengaturan > keamanan/Security > nyalain email (secure) > ada backup code generate' 
          })
        return i.reply({ embeds: [embed] })
      }

      if(i.commandName==='qris'){
        const embed = new EmbedBuilder()
          .setColor(red)
          .setTitle('💳 QRIS Payment')
          .setDescription('Scan QR Code di bawah ini untuk melakukan pembayaran via QRIS dan Sertakan Bukti pembayarannya')
          .setImage('https://media.discordapp.net/attachments/1433166490751860847/1433362892757008414/qris.png?ex=69046ab8&is=69031938&hm=03a77859f77fedd3882e570f79593cca8dc499359ea2b84296939b41b0aa8c02&=&format=webp&quality=lossless&width=1032&height=1032')
          .setFooter({ text: 'Raura Store - QRIS Payment' })
        return i.reply({ embeds: [embed] })
      }

      if(i.commandName==='group'){
        const embed = new EmbedBuilder()
          .setColor(red)
          .setTitle('👥 Group Community Roblox')
          .setDescription('Harus stay di Group Community selama **14 hari**\nJika ingin membeli robux instant tanpa login\n\n🔗 **Link Group:**\nhttps://www.roblox.com/share/g/52494457')
          .setImage('https://media.discordapp.net/attachments/1371117230208585783/1417544037346316420/CARA_MEMBUAT_Presentasi_1.png?ex=68cade43&is=68c98cc3&hm=1511df7e39f0e88591742a408bf8aa9018a9d3ff6587da679e1f57a196c58320&=&format=webp&quality=lossless&width=1522&height=856')
          .setFooter({ text: 'Raura Store' })
        return i.reply({ embeds: [embed] })
      }

      if(i.commandName==='fishit'){
        const embed = new EmbedBuilder()
          .setColor(red)
          .setTitle('🎣 FishIt Server Link')
          .setDescription('Silahkan Klik link tersebut dan join, yang pake RF jangan mager yok kita tidak menerima add friend dan join link kalian Terima kasih🙏\n\n🔗 **Link Server:**\nhttps://www.roblox.com/share?code=bab71f9550ca334d96bc117b501865b1&type=Server')
          .setFooter({ text: 'Raura Store' })
        return i.reply({ embeds: [embed] })
      }

      if(i.commandName==='chat'){
        if(!isAdmin(i.member)) return i.reply({ content:'Kamu tidak punya izin.', ephemeral:true })
        const message = i.options.getString('message', true)
        await i.channel.send({ content: message })
        return i.reply({ content: '✅ Pesan berhasil dikirim.', ephemeral: true })
      }

      if(i.commandName==='rates'){
        const sub=i.options.getSubcommand()
        if(sub==='show'){
          const r=CONFIG.rates
          return i.reply({ embeds:[ new EmbedBuilder().setColor(red).setTitle('Rates Saat Ini').setDescription(`• Before tax (GP delay): **${r.gamepass_before_tax_delay}**\n• After tax (GP delay): **${r.gamepass_after_tax_delay}**\n• Gift GP instant: **${r.gift_gamepass_instant}**\n• Instant payout: **${r.instant_payout}**\n• Via Login: **${r.via_login}**`) ] })
        }
        if(sub==='set'){
          if(!isAdmin(i.member)) return i.reply({ content:'Admin only.', ephemeral:true })
          const jenis=i.options.getString('jenis',true); const nilai=i.options.getInteger('nilai',true)
          if(jenis==='before_tax') CONFIG.rates.gamepass_before_tax_delay=nilai
          else if(jenis==='after_tax') CONFIG.rates.gamepass_after_tax_delay=nilai
          else if(jenis==='gift') CONFIG.rates.gift_gamepass_instant=nilai
          else if(jenis==='instant') CONFIG.rates.instant_payout=nilai
          else if(jenis==='login') CONFIG.rates.via_login=nilai
          else return i.reply({ content:'Jenis tidak dikenal.', ephemeral:true })
          return i.reply({ content:`✅ Rate **${jenis}** diupdate ke **${nilai}**.`, ephemeral:true })
        }
      }
    }

    if(i.isButton()){
      if(i.customId==='verify_grant'){
        const role=i.guild.roles.cache.get(CONFIG.marketAccessRoleId)
        if(!role) return i.reply({ content:'Role Market Access belum diset.', ephemeral:true })
        const member=await i.guild.members.fetch(i.user.id)
        if(member.roles.cache.has(role.id)) return i.reply({ content:'Kamu sudah punya role ini.', ephemeral:true })
        await member.roles.add(role)
        return i.reply({ content:`✅ Berhasil! Kamu mendapatkan role ${role}.`, ephemeral:true })
      }
      const pb=CONFIG.payments.buttons; const map={ pay_mandiri: pb.mandiri.message,
        pay_bca: pb.bca.message,
        pay_gopay: pb.gopay.message,
        pay_seabank: pb.seabank.message,
        pay_qris: pb.qris.message }
      if(map[i.customId]) return i.reply({ content:map[i.customId], ephemeral:true })
    }

    if(i.type===InteractionType.ModalSubmit && i.customId==='order_modal'){
      const method=i.fields.getTextInputValue('m'); const amount=parseInt(i.fields.getTextInputValue('a').replace(/\D/g,'')); const contact=i.fields.getTextInputValue('c')
      const price=amount*CONFIG.rates.gift_gamepass_instant
      await i.reply({ content:`Terima kasih! Order: **${amount} Robux** via **${method}**. Estimasi: **Rp ${price.toLocaleString('id-ID')}**. Admin akan menghubungi kamu.`, ephemeral:true })
      if(CONFIG.orderLogChannelId){ const ch=await client.channels.fetch(CONFIG.orderLogChannelId).catch(()=>null); if(ch?.isTextBased()) ch.send({ embeds:[ new EmbedBuilder().setColor(red).setTitle('Order Baru').setDescription(`By: <@${i.user.id}>\nMethod: **${method}**\nJumlah: **${amount} Robux**\nEstimasi: **Rp ${price.toLocaleString('id-ID')}**\nKontak: ${contact}`) ] }) }
    }
  }catch(err){ console.error(err); if(i.isRepliable()) i.reply({ content:'Terjadi error.', ephemeral:true }).catch(()=>{}) }
})

client.login(process.env.BOT_TOKEN)
