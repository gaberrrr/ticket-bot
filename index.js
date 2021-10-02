var Discord = require("discord.js"),
client = new Discord.Client(),
Enmap = require("enmap"),
db = new Enmap({name: "tickets"}),
devs = ["615327172592402435","321848530291523585","404286565301616650"],
prefix = "-"
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);


setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


client.on("ready", () => {
console.log("ready! " + client.user.id);
});
client.on('raw',async event => {
  const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
  };

  if (!events.hasOwnProperty(event.t)) return;
  if (event.t === 'MESSAGE_REACTION_ADD'){
    const { d: data } = event;
    const channel = client.channels.get(data.channel_id);
    const msg = await channel.fetchMessage(data.message_id).catch(e => console.error(e))
    const user = client.users.get(data.user_id);
    const member = msg.guild.members.get(user.id);
    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    const reaction = msg.reactions.get(emojiKey);
    db.ensure(`guilds`, [] , `${msg.guild.id}.reactionMessages`)
    const MessagesID = await db.get(`guilds`, `${msg.guild.id}.reactionMessages`)
    if(!MessagesID) return console.log(`${msg.guild.id}, ${msg.guild.name}, no messages id`)
    if(MessagesID.length < 1 || !MessagesID) return
    if(!MessagesID.includes(msg.id)) return
    if(!emojiKey === '✉') return
    if(user.bot) return;
    reaction.remove(user);
if(db.get(`ticket${user.id}`,"blacklist") !== false) return user.send(`**❌ | You cannot create a ticket because: You're on blacklist.**`).catch(e => console.error(e));
if(db.get(`ticket${msg.guild.id}`,"onoff") !== 'on') return user.send(`**❌ | You cannot create a ticket because: ticket has been disabled or you not setup.**`).catch(e => console.error(e));
if(!msg.guild.member(client.user).hasPermission("ADMINISTRATOR")) return user.send(`**❌ | I do not have permission.**`).catch(e => console.error(e));
 if(db.get(`ticket${user.id}`,"limited") == 1) return user.send(`**❌ | You already opened ticket.**`).catch(e => console.error(e));
msg.guild.createChannel(`ticket-` + db.get(`ticket${msg.guild.id}`,"count"), "text").then(c => {
let role = msg.guild.roles.find(r => r.id == db.get(`ticket${msg.guild.id}`,"adminrole"));
let role2 = msg.guild.roles.find(r => r.name == "@everyone");
c.overwritePermissions(role, {
SEND_MESSAGES: true,
READ_MESSAGES: true
});
c.overwritePermissions(role2, {
SEND_MESSAGES: false,
READ_MESSAGES: false
});
c.overwritePermissions(member, {
SEND_MESSAGES: true,
READ_MESSAGES: true
});
c.setParent(db.get(`ticket${msg.guild.id}`,"category"))
const new1 = new Discord.RichEmbed()
.setColor(db.get(`ticket${msg.guild.id}`,"embedcolor"))
.setAuthor(user.username,user.displayAvatarURL)
.setDescription(`**✅ | Done Open your Ticket: ${c || "Ticket Has Been Closed"}**`)
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp();
user.send(new1).catch(e => e);
db.math(`ticket${msg.guild.id}`,"add",1,"count")
db.math(`ticket${user.id}`,"add",1,"count")
db.set(`ticket${user.id}`,c.id,"ticketid")
c.send(`${db.get(`ticket${msg.guild.id}`,"message").replace("{user}", member).replace("{userid}",user.id).replace("{guildname}",msg.guild.name).replace("{guildid}",msg.guild.id).replace("{ticketname}",c.name).replace("{ticketid}",c.id)}`);
let channel = msg.guild.channels.find(c => c.id == db.get(`ticket${msg.guild.id}`,"log"))
if(!channel) return undefined;
let lognew = new Discord.RichEmbed()
.setTitle("Ticket Opened!")
.setAuthor(user.username,user.avatarURL)
.addField("❯ By",`» ${member}`,true)
.addField("❯ Ticket name",`» ${c}`,true)
.setColor(db.get(`ticket${msg.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
channel.send(lognew).catch(e => e);
})
  }
});


client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');

if(args[0].toLowerCase() == prefix + `add-rtickets`) {
db.ensure(`guilds`, [], `${message.guild.id}.reactionMessages`)
db.ensure(`guilds`, {}, `${message.guild.id}.reactionTickets`)
        let channel = message.guild.channels.get(args[1]) || message.guild.channels.find(c => c.name.toLowerCase().includes(args.slice(1).join(' '))) || message.mentions.channels.first()
        let embed = new Discord.RichEmbed()
        .setTitle("تذكرة ردة الفعل")
        .setDescription(`** اضغط عالرياكشن ✉ لفتح تذكرة **`)
        .setFooter(client.user.username)
        .setColor("BLUE")
        channel.send(embed).then(m => {
          m.react('✉')
          db.set(`guilds`, channel.id,`${message.guild.id}.reactionTickets.${m.id}.channel`)
          message.channel.send(channel+" تم اضافة تيكت ريأكشن الى")
        }).catch(e => console.log(e))
}
});
 
 client.on('message', async message => {
if(message.author.bot) return undefined;
db.ensure(`ticket${message.guild.id}`,{count: 1,category: "",log: "",adminrole: "",message: "",embedcolor: "",onoff: "off"})
db.ensure(`ticket${message.author.id}`,{count: 1,limited: 0,blacklist: false,ticketid: "",userid: message.author.id})
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `setup`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | You do not have permission.**`);
if(db.get(`ticket${message.guild.id}`,"setup" !== "off")) return message.channel.send(`**❌ | You already setup**`)
let e = new Discord.RichEmbed()
.setAuthor("Step 1",message.author.avatarURL)
.setTitle(`Set-adminrole`)
.setDescription(`⚠ | Mention Role`)
.setColor("BLACK")
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
message.channel.send(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(r => {
let role = message.guild.roles.find(e => e.id === r.first().mentions.roles.first().id)
if(!role) return message.channel.send(`**❌ | Error**`)
let e = new Discord.RichEmbed()
.setAuthor("Step 2",message.author.avatarURL)
.setTitle(`Set-ticketlog channel`)
.setDescription(`⚠ | Mention Room`)
.setColor("BLACK")
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
mes.edit(e).then(mssaes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(ro => {
let channelid = message.guild.channels.find(e => e.id === ro.first().mentions.channels.first().id)
if(!channelid) return message.channel.send(`**❌ | Error**`)
let e = new Discord.RichEmbed()
.setAuthor("Step 3",message.author.avatarURL)
.setTitle(`Set-category`)
.setDescription(`⚠ | Type Category ID`)
.setColor("BLACK")
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
mssaes.edit(e).then(mesadfcvs => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(rsdo => {
let c = message.guild.channels.filter(e => e.type === "category").find(e=>e.id === rsdo.first().content)
if(!c) return message.channel.send(`**❌ | Error**`)
let e = new Discord.RichEmbed()
.setAuthor("Step 4",message.author.avatarURL)
.setTitle(`Set-message`)
.setDescription(`⚠ | Type Message`)
.addField(`✅ | To show the user name, type:`,`\`\`{user}\`\``)
.addField(`✅ | To show the user ID, type:`,`\`\`{userid}\`\``)
.addField(`✅ | To show server name, type:`,`\`\`{guildname}\`\``)
.addField(`✅ | To show server name, type:`,`\`\`{guildid}\`\``)
.addField(`✅ | To show ticket name, type:`,`\`\`{ticketname}\`\``)
.addField(`✅ | To show ticket ID, type:`,`\`\`{ticketid}\`\``)
.addField(`✅ | Example:`,`Hey {user} \`(UserID: {userid})\`, you in **{guildname}** \`(GuildID: {guildid})\`  your ticket is: {ticketname} \`(TicketID: {ticketid})\``)
.setColor("BLACK")
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
mesadfcvs.edit(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(me => {
let e = new Discord.RichEmbed()
.setAuthor("Step 5",message.author.avatarURL)
.setTitle(`Set-Embedcolor`)
.setDescription(`⚠ | Send Color`)
.addField(`✅ | Example:`,`#000000`)
.setColor("BLACK")
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
mes.edit(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(color => {
if(!color.first().content.startsWith("#")) return message.channel.send(`**❌ | Error**`)
db.set(`ticket${message.guild.id}`, role.id,"adminrole")
db.set(`ticket${message.guild.id}`, channelid.id,"log")
db.set(`ticket${message.guild.id}`, c.id,"category")
db.set(`ticket${message.guild.id}`, me.first().content,"message")
db.set(`ticket${message.guild.id}`, color.first().content,"embedcolor")
db.set(`ticket${message.guild.id}`, "on","onoff")
message.channel.send("**✅ | Done**")
message.channel.bulkDelete(8)
})
})
})
})
})
})
})
})
})
})
}
})

client.on('message', async message => {
db.ensure(`ticket${message.author.id}`,{count: 1,limited: 0,blacklist: false,ticketid: "",userid: message.author.id})
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `new`) {
if(db.get(`ticket${message.author.id}`,"blacklist") !== false) return message.channel.send(`**❌ | You cannot create a ticket because: You're on blacklist.**`)
if(db.get(`ticket${message.guild.id}`,"onoff") !== 'on') return message.channel.send(`**❌ | You cannot create a ticket because: ticket has been disabled or you not setup.**`)
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(db.get(`ticket${message.author.id}`,"limited") == 1) return message.channel.send(`**❌ | You already opened ticket.**`);
message.guild.createChannel(`ticket-` + db.get(`ticket${message.guild.id}`,"count"), "text").then(c => {
let role = message.guild.roles.find("id",db.get(`ticket${message.guild.id}`,"adminrole"));
let role2 = message.guild.roles.find("name", "@everyone");
c.overwritePermissions(role, {
SEND_MESSAGES: true,
READ_MESSAGES: true
});
c.overwritePermissions(role2, {
SEND_MESSAGES: false,
READ_MESSAGES: false
});
c.overwritePermissions(message.author, {
SEND_MESSAGES: true,
READ_MESSAGES: true
});
c.setParent(db.get(`ticket${message.guild.id}`,"category"))
const new1 = new Discord.RichEmbed()
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setAuthor(message.author.username,message.author.displayAvatarURL)
.setDescription(`**✅ | Done Open your Ticket: ${c || "Ticket Has Been Closed"}**`)
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp();
message.channel.send(new1);
db.math(`ticket${message.guild.id}`,"add",1,"count")
db.math(`ticket${message.author.id}`,"add",1,"count")
db.set(`ticket${message.author.id}`,c.id,"ticketid")
c.send(`${db.get(`ticket${message.guild.id}`,"message").replace("{user}", message.author).replace("{userid}",message.author.id).replace("{guildname}",message.guild.name).replace("{guildid}",message.guild.id).replace("{ticketname}",c.name).replace("{ticketid}",c.id)}`);
let channel = message.guild.channels.find("id",db.get(`ticket${message.guild.id}`,"log"))
if(!channel) return undefined;
let lognew = new Discord.RichEmbed()
.setTitle("Ticket Opened!")
.setAuthor(message.author.username,message.author.avatarURL)
.addField("❯ By",`» ${message.author}`,true)
.addField("❯ Ticket name",`» ${c}`,true)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
channel.send(lognew);
})
}
})

client.on('message', async message => {
db.ensure(`ticket${message.author.id}`,{count: 1,limited: 0,blacklist: false,ticketid: "",userid: message.author.id})
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `close`) {
if(db.get(`ticket${message.author.id}`,"blacklist") !== false) return message.channel.send(`**❌ | You cannot create a ticket because: You're on blacklist.**`)
if(db.get(`ticket${message.guild.id}`,"onoff") !== 'on') return message.channel.send(`**❌ | You cannot create a ticket because: ticket has been disabled or you not setup.**`)
if(!message.channel.name.startsWith(`ticket-`)) return message.channel.send(`**❌ | You Can't Close Ticket Please Go To Your Ticket.**`);
let e = new Discord.RichEmbed()
.setAuthor(message.guild.name,message.guild.iconURL)
.setColor("BLUE")
.addField("» \`\`Close\`\`","» 1️⃣")
.setFooter(message.author.username,message.author.avatarURL)
message.channel.send(e).then(async o => {
await o.react("1️⃣")
let cow = (react,user) => react.emoji.name === "1️⃣" && user.id === message.author.id;
let coutwith = o.createReactionCollector(cow, { time: 0})
coutwith.on("collect", r => {
message.channel.delete()
let channel = message.guild.channels.find("id", db.get(`ticket${message.guild.id}`,"log"))
if(!channel) return undefined;
let logclose = new Discord.RichEmbed()
.setTitle("Ticket Closed!")
.setAuthor(message.author.username,message.author.avatarURL)
.addField("❯ Ticket",`» \`\`${message.channel.name}\`\``,true)
.addField("❯ Closed By",`» <@${message.author.id}>`,true)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
channel.send(logclose);
channel.send({files: [`./tickets/transcript-${message.channel.name}.html`]})
db.delete(`ticket${message.author.id}`,"userid")
})
})
}
})

client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `set-ticketlog`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
let e = new Discord.RichEmbed()
.setAuthor(message.author.username,message.author.avatarURL)
.setTitle(`Set-ticketlog`)
.setDescription(`⚠ | Mention Room`)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
message.channel.send(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(me => {
db.set(`ticket${message.guild.id}`, me.first().mentions.channels.first().id,"log")
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
mes.delete()
me.delete()
})
})
}
})

client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `reset-tickets`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
db.set(`ticket${message.guild.id}`, 1,"count")
}
})
client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `toggle-ticket`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
let e = new Discord.RichEmbed()
.setColor("BLUE")
.setDescription(`**» ON › 1️⃣
» OFF › 2️⃣**`)
.setFooter(message.author.username,message.author.avatarURL)
message.channel.send(e).then(o => {
o.react("1️⃣")
o.react("2️⃣")
let n = (react,user) => react.emoji.name === "1️⃣" && user.id === message.author.id;
let on = o.createReactionCollector(n, { time: 0})
let off = (react,user) => react.emoji.name === "2️⃣" && user.id === message.author.id;
let offf = o.createReactionCollector(off, { time: 0})
on.on("collect", r => {
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
db.set(`ticket${message.guild.id}`, "on","onoff")
})
offf.on("collect", r => {
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
db.set(`ticket${message.guild.id}`, "off","onoff")
})
})
}
})

client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `add-blacklist`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
let e = new Discord.RichEmbed()
.setAuthor(message.author.username,message.author.avatarURL)
.setTitle(`Add-blacklist`)
.setDescription(`⚠ | Mention user`)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
message.channel.send(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(me => {
db.ensure(`ticket${me.first().mentions.users.first().id}`,{count: 1,limited: 0,blacklist: false,ticketid: "",userid: me.first().mentions.users.first().id})
db.set(`ticket${me.first().mentions.users.first().id}`, true,"blacklist")
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
mes.delete()
me.delete()
})
})
}
})

client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `remove-blacklist`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
let e = new Discord.RichEmbed()
.setAuthor(message.author.username,message.author.avatarURL)
.setTitle(`Remove-blacklist`)
.setDescription(`⚠ | Mention user`)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
message.channel.send(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(me => {
db.ensure(`ticket${me.first().mentions.users.first().id}`,{count: 1,limited: 0,blacklist: false,ticketid: "",userid: me.first().mentions.users.first().id})
db.set(`ticket${me.first().mentions.users.first().id}`, false,"blacklist")
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
mes.delete()
me.delete()
})
})
}
})

client.on('message', async message => {
if(message.author.bot) return undefined;
let args = message.content.split(' ');
if(args[0].toLowerCase() == prefix + `set-message`) {
if(!message.guild.member(client.user).hasPermission("ADMINISTRATOR")) return message.channel.send(`**❌ | I do not have permission.**`);
if(!message.guild.member(message.author).roles.find(e => e.id === db.get(`ticket${message.guild.id}`,"adminrole"))) return message.channel.send(`**❌ | You do not have the required rank or you not setup**`);
let e = new Discord.RichEmbed()
.setAuthor(message.author.username,message.author.avatarURL)
.setTitle(`Set-newmessage`)
.setDescription(`⚠ | Type Message`)
.addField(`✅ | To show the user name, type:`,`\`\`{user}\`\``)
.addField(`✅ | To show the user ID, type:`,`\`\`{userid}\`\``)
.addField(`✅ | To show server name, type:`,`\`\`{guildname}\`\``)
.addField(`✅ | To show server name, type:`,`\`\`{guildid}\`\``)
.addField(`✅ | To show ticket name, type:`,`\`\`{ticketname}\`\``)
.addField(`✅ | To show ticket ID, type:`,`\`\`{ticketid}\`\``)
.addField(`✅ | Example:`,`Hey {user} \`(UserID: {userid})\`, you in **{guildname}** \`(GuildID: {guildid})\`  your ticket is: {ticketname} \`(TicketID: {ticketid})\``)
.setColor(db.get(`ticket${message.guild.id}`,"embedcolor"))
.setFooter(client.user.username,client.user.avatarURL)
.setTimestamp()
message.channel.send(e).then(mes => {
message.channel.awaitMessages(m => m.author.id == message.author.id, {
max: 1,
time: 120000,
errors: ['time']
}).then(me => {
db.set(`ticket${message.guild.id}`, me.first().content,"message")
message.channel.send(`**✅ | Done**`).then(e=>e.delete(5000))
mes.delete()
me.delete()
})
})
}
})

client.on("message", async message => {

    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
       if(devs.includes(message.author.id)) {
    if (args[0] == `${prefix}setname`) {
       message.delete();
      if (!args[1]) return message.reply("Type the new username!").then(message => {
              message.delete(20000);
  });
      try {
        await client.user.setUsername(args.slice(1).join(" "));
        await message.reply("Done").then(message => {
              message.delete(20000);
  });
      } catch (e) {
        await message.reply(`Error! ${e.message || e}`);
      }
    }
  }
    });
  client.on("message", async message => {
  
    if (!message.guild || message.author.bot) return;
    let args = message.content.split(" ");
    if(devs.includes(message.author.id)) {
   if (args[0] == `${prefix}setavatar`) {
       message.delete();
      if (!args[1]) return message.reply("Type the avatar URL!").then(message => {
              message.delete(20000);
  });
      try {
        await client.user.setAvatar(args[1]);
        await message.reply("Done").then(message => {
              message.delete(20000);
  }); 
             message.delete();
  
      } catch (e) {
        message.reply(`Error! ${e.message || e}`);
      }
    }
       }
  });


client.login("NzE5MTcxMTYyMTE0MDk3MTk2.XtziWw.KnswkJOh9jS5n2UWjKpIuiZHxRY");
