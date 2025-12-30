const selfClient = require('./client.js')
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const fs = require('fs')
const path = require('path')
const config = require('./config2')
const OWNER_FILE = path.resolve(__dirname, 'owners.json')
let extraOwners = []
if (fs.existsSync(OWNER_FILE)) {
  try { extraOwners = JSON.parse(fs.readFileSync(OWNER_FILE, 'utf8')) } catch (_) { extraOwners = [] }
} else {
  fs.writeFileSync(OWNER_FILE, JSON.stringify([], null, 2))
}
const saveOwners = () => fs.writeFileSync(OWNER_FILE, JSON.stringify(extraOwners, null, 2))
const isMaster = id => id === config.owners[0]
const isOwner = id => isMaster(id) || extraOwners.includes(id)

const activeLbs = new Map() 
const LB_UPDATE_INTERVAL = 8000 
const LB_RETRY_DELAY = 15000 
const MAX_ERRORS = 10 

async function generateLb(sc) {
  const data = []
  let totalVocal = 0
  let totalMute = 0
  let totalStream = 0
  let totalCam = 0
  let totalActif = 0
  
  try {
    await sc.guilds.fetch()
  } catch (e) {
    console.log('[LB] Erreur fetch guilds, on utilise le cache')
  }
  for (const [, guild] of sc.guilds.cache) {
    try {
      const voiceStates = guild.voiceStates.cache.filter(v => v.channelId)
      if (!voiceStates.size) continue
      const vocal = voiceStates.size
      const mute = voiceStates.filter(v => v.mute || v.selfMute || v.deaf || v.selfDeaf).size
      const stream = voiceStates.filter(v => v.streaming).size
      const cam = voiceStates.filter(v => v.selfVideo).size
      const actif = vocal - mute
      
      totalVocal += vocal
      totalMute += mute
      totalStream += stream
      totalCam += cam
      totalActif += actif
      
      data.push({
        name: guild.name.length > 20 ? guild.name.slice(0, 18) + '..' : guild.name,
        vocal,
        mute,
        stream,
        cam,
        mutePercentage: vocal ? (mute / vocal) * 100 : 0,
        actif
      })
    } catch (e) {
      console.log(`[LB] Erreur sur guild ${guild.name}, on skip`)
    }
  }
  data.sort((a, b) => b.vocal - a.vocal)
  
  const embeds = []
  const MAX = 20 
  
  for (let i = 0; i < data.length; i += MAX) {
    const slice = data.slice(i, i + MAX)
    const e = new EmbedBuilder()
      .setTitle(config.embed.title)
      .setColor(config.embed.color)
      .setTimestamp()
    
    let description = ''
    slice.forEach((s, idx) => {
      const rank = i + idx + 1
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank})**`
      description += `${medal} **${s.name}** • **${s.vocal}** vocs\n`
      description += `> ${s.actif} actifs, ${s.mute} mutes, ${s.stream} streams, ${s.cam} cams\n`
      description += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`
    })
    
    e.setDescription(description)
    
    const totalMutePercent = totalVocal ? Math.round((totalMute / totalVocal) * 100) : 0
    e.setFooter({ 
      text: `📊 ${totalVocal} vocs | ${totalActif} actifs | ${totalMute} mutes (${totalMutePercent}%) | Page ${Math.floor(i / MAX) + 1}/${Math.ceil(data.length / MAX)}` 
    })
    
    embeds.push(e)
  }
  
  if (!embeds.length) {
    const empty = new EmbedBuilder()
      .setTitle(config.embed.title)
      .setColor(config.embed.color)
      .setDescription('')
      .setTimestamp()
    embeds.push(empty)
  }
  return embeds
}

async function startPersistentLb(channel, existingMsgId = null) {
  const channelId = channel.id
  
  if (activeLbs.has(channelId)) {
    const old = activeLbs.get(channelId)
    if (old.interval) clearInterval(old.interval)
    activeLbs.delete(channelId)
  }
  
  let lbData = { idx: 0, errorCount: 0, msgId: existingMsgId }
  
  async function getOrCreateMessage() {
    try {
      if (lbData.msgId) {
        const existingMsg = await channel.messages.fetch(lbData.msgId).catch(() => null)
        if (existingMsg) return existingMsg
      }
      const waiting = new EmbedBuilder()
        .setTitle('Génération du leaderboard')
        .setColor('#4f545c')
        .setDescription('patiente un peu bg...')
      const newMsg = await channel.send({ embeds: [waiting] })
      lbData.msgId = newMsg.id
      console.log(`[LB] Nouveau message créé: ${newMsg.id}`)
      return newMsg
    } catch (e) {
      console.log(`[LB] Erreur getOrCreateMessage: ${e.message}`)
      return null
    }
  }
  
  async function updateLb() {
    try {
      const msg = await getOrCreateMessage()
      if (!msg) {
        lbData.errorCount++
        if (lbData.errorCount >= MAX_ERRORS) {
          console.log(`[LB] Trop d'erreurs, on attend ${LB_RETRY_DELAY/1000}s...`)
          lbData.errorCount = 0
          await new Promise(r => setTimeout(r, LB_RETRY_DELAY))
        }
        return
      }
      
      const pages = await generateLb(selfClient)
      lbData.idx = (lbData.idx + 1) % pages.length
      await msg.edit({ embeds: [pages[lbData.idx]] })
      lbData.errorCount = 0 
      lbData.lastUpdate = Date.now()
    } catch (e) {
      console.log(`[LB] Erreur update: ${e.message}`)
      lbData.errorCount++
      
      if (e.code === 10008) {
        console.log('[LB] Message supprimé, on va en recréer un')
        lbData.msgId = null
      }
      
      if (lbData.errorCount >= MAX_ERRORS) {
        console.log(`[LB] Trop d'erreurs consécutives, pause de ${LB_RETRY_DELAY/1000}s`)
        await new Promise(r => setTimeout(r, LB_RETRY_DELAY))
        lbData.errorCount = 0
        lbData.msgId = null 
      }
    }
  }
  
  await updateLb()
  
  const interval = setInterval(updateLb, LB_UPDATE_INTERVAL)
  
  lbData.interval = interval
  activeLbs.set(channelId, lbData)
  
  console.log(`[LB] Leaderboard démarré sur channel ${channelId}`)
  return lbData
}
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})
bot.once('ready', async () => {
  console.log(`[BOT] Connecté en tant que ${bot.user.tag}`)
  
  const channel = await bot.channels.fetch(config.channelid).catch(() => null)
  if (!channel?.isTextBased()) {
    console.log('[BOT] Channel non trouvé ou pas text-based')
    return
  }
  
  if (!selfClient?.readyAt) {
    console.log('[BOT] Attente du selfClient...')
    await new Promise(r => selfClient.once('ready', r))
  }
  
  console.log('[BOT] Démarrage du leaderboard automatique...')
  await startPersistentLb(channel)
})
bot.on('messageCreate', async msg => {
  if (msg.author.bot) return
  if (!msg.content.startsWith('+')) return
  if (!isOwner(msg.author.id)) return
  const args = msg.content.slice(1).trim().split(/\s+/)
  const cmd = args.shift().toLowerCase()
  
  if (cmd === 'lb') {
    if (activeLbs.has(msg.channel.id)) {
      const lb = activeLbs.get(msg.channel.id)
      if (lb.interval) clearInterval(lb.interval)
      activeLbs.delete(msg.channel.id)
    }
    await startPersistentLb(msg.channel)
    return
  }
  
  if (cmd === 'owner') {
    if (!args.length) {
      const list = [config.owners[0], ...extraOwners].map(id => `<@${id}>`).join(', ')
      return msg.channel.send(`Owners actuels bg : ${list || 'Aucun dsl'}`)
    }
    if (!isMaster(msg.author.id)) return msg.channel.send('ta pas la perm de use cette cmd ptit reuf')
    const id = args[0].replace(/[<@!>]/g, '')
    if (extraOwners.includes(id)) {
      extraOwners = extraOwners.filter(o => o !== id)
      saveOwners()
      return msg.channel.send(`ID ${id} delete de la liste`)
    } else {
      if (id === config.owners[0]) return msg.channel.send('ce compte est deja owner tocard bucal trbl')
      extraOwners.push(id)
      saveOwners()
      return msg.channel.send(`ID ${id} add de la liste`)
    }
  }
})

bot.login(config.bot.token).catch(err => {
  console.error('[BOT] Erreur de connexion:', err)
  process.exit(1)
})

// Gestion des erreurs non gérées pour éviter les crashes
process.on('unhandledRejection', (reason, promise) => {
  console.log('[ERROR] Unhandled Rejection:', reason)
})

process.on('uncaughtException', (error) => {
  console.log('[ERROR] Uncaught Exception:', error)
})