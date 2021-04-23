const {Discord, Client, Guild, GuildChannel, TextChannel, MessageEmbed} = require("discord.js");
const mongoose = require("mongoose");
const { async } = require("regenerator-runtime");
const helper = require("./Bot.json");
const client = new Client();
const Bots = global.Bots = [];
const backup = require("./models/rolBackup")
// Mongoose
mongoose.set('useFindAndModify', false);
mongoose.connect("mongo url", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on("connected", () => {
    console.log("MongoDB bağlanıldı.")
});

let Tokens = helper.Tokens;

Tokens.forEach(token => {
    let bot = new Client();

    bot.on("ready", () => {
        console.log(`${bot.user.tag} - Destekçi bot olarak aktif.`);
        bot.Busy = false;
        bot.Uj = 0;
        Bots.push(bot);
    })

    bot.login(token).then(e => {
    }).catch(e => {
        console.error(`${token.substring(Math.floor(token.length / 2))} giriş yapamadı.`);
    });
});

client.on("ready", async () => {
    console.log("Ana bot aktifleşti.");
});
client.on("message", async message => {
    let embed = new MessageEmbed().setAuthor(message.member.displayName, message.author.avatarURL({dynamic: true})).setColor("RANDOM").setTimestamp()
    if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(helper.botPrefix)) return;
    if (message.author.id !== "BOT SAHİBİ İD") return;
    let args = message.content.split(' ').slice(1);
    let command = message.content.split(' ')[0].slice(helper.botPrefix.length);
  
    if (command === "eval" && message.author.id === "BOT SAHİBİ İD") {
      if (!args[0]) return message.channel.send(`KOD BELİRT!`);
        let code = args.join(' ');
        function clean(text) {
        if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
        text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
        return text;
      };
      try { 
        var evaled = clean(await eval(code));
        if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
        message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
      } catch(err) { message.channel.send(err, {code: "js", split: true}) };
    };

if (command === "yedekle" && message.author.id === "BOT SAHİBİ İD") {
  await backup.deleteMany({});
if(backup) {await backup.deleteMany({});}
message.guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(async role => {
let roleChannelOverwrites = [];
message.guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
 let channelPerm = c.permissionOverwrites.get(role.id);
 let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
 roleChannelOverwrites.push(pushlanacak);
});
   await new backup({
     _id: new mongoose.Types.ObjectId(),
     guildID: "SUNUCUİD",
     roleID: role.id,
     name: role.name,
     color: role.hexColor,
     hoist: role.hoist,
     position: role.position,
     permissions: role.permissions,
     mentionable: role.mentionable,
     time: Date.now(),
     members: role.members.map(m => m.id),
     channelOverwrites: roleChannelOverwrites
   }).save();
 })        
 message.channel.send("**Manuel** backup alma işlemi gerçekleşti.") 
}
    if(command === "rolkur" && message.author.id === "BOT SAHİBİ İD") {
      if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));

      backup.findOne({guildID: helper.Guild, roleID: args[0]}, async (err, roleData) => {

        let yeniRol = await message.guild.roles.create({
          data: {
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist,
            permissions: roleData.permissions,
            position: roleData.position,
            mentionable: roleData.mentionable
          },
          reason: "Backup sistemi devreye girdi rol oluşturuldu ve dağıtılmaya hazırlanıyor."
        });
        message.channel.send(`- Başarılı bir şekilde ${yeniRol} kurulumu tamamlandı rol dağıtımına başlayabilirsin. - !backup ${args[0]} \`<@&${yeniRol.id}>\``)
      })
    }

    if(command === "backup" && message.author.id === "BOT SAHİBİ ID") {
      let rol = message.mentions.roles.first();
      if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));
      let data = await backup.findOne({guildID: helper.Guild, roleID: args[0]})
      if(!data) return message.channel.send(`Kurmaya çalıştığınız backup ID bulunamadı.`)

      setTimeout(() => {
        let kanalPermVeri = data.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(rol, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);
      let length = data.members.length;
        if(length <= 0) return console.log(`[${role.id}] Olayında kayıtlı üye olmadığından dolayı rol dağıtımı gerçekleştirmedim. `);
        let availableBots = Bots.filter(e => !e.Busy);
        if(availableBots.length <= 0) availableBots = Bots.sort((x,y) => y.Uj - x.Uj).slice(0, Math.round(length / Bots.length));
        let perAnyBotMembers = Math.floor(length / availableBots.length);
        if(perAnyBotMembers < 1) perAnyBotMembers = 1;
        for (let index = 0; index < availableBots.length; index++) {
            const bot = availableBots[index];
            let ids = data.members.slice(index * perAnyBotMembers, (index + 1) * perAnyBotMembers);
            if(ids.length <= 0) {processBot(bot, false, -perAnyBotMembers); break;}
            let guild = bot.guilds.cache.first();
            message.channel.send(`[BACKUP] - Başarılı bir şekilde kurulum başladı roller dağıtılıp odalara ekleniyor.`)
            ids.every(async id => {
                let member = guild.member(id);
                if(!member){
                    return true;
                }
                setTimeout(async() => {
                  if(member.roles.cache.has(rol.id)) return
                  await member.roles.add(rol.id)
              }, index*1250);
            });
            processBot(bot, false, -perAnyBotMembers);
        }}
})


function giveBot(length){
    if(length > Bots.length) length = Bots.length;
    let availableBots = Bots.filter(e => !e.Busy);
    if(availableBots.length <= 0) availableBots = Bots.sort((x,y) => x.Uj - y.Uj).slice(0, length);

    return availableBots;
}

function processBot(bot, busy, job, equal = false){
    bot.Busy = busy;
    if(equal) bot.Uj = job;
    else bot.Uj += job;

    let index = Bots.findIndex(e => e.user.id == bot.user.id);
    Bots[index] = bot;
}

function safe(id){
    if(id == client.user.id || Bots.some(e => e.user.id == id) || helper.Izinliler.includes(id)) return true;
    return false;
}

function closeAllPerms(){
    let sunucu = client.guilds.cache.get("sunucu ıd");
    if (!sunucu) return;
    sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_NICKNAMES") || r.permissions.has("MANAGE_WEBHOOKS") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_CHANNELS") || r.permissions.has("MANAGE_EMOJIS") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("BAN_MEMBERS") || r.permissions.has("KICK_MEMBERS"))).forEach(async r => await r.setPermissions(0));     
  
}

client.login(helper.Token);
