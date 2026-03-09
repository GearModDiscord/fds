const { 
Client, 
GatewayIntentBits, 
SlashCommandBuilder, 
REST, 
Routes,
ActionRowBuilder,
StringSelectMenuBuilder,
ButtonBuilder,
ButtonStyle,
ChannelType,
PermissionsBitField
} = require("discord.js");

const util = require("minecraft-server-util");
const readline = require("readline");

/* CONFIG */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1479616798847406090";
const GUILD_ID = "1472651115223847026";
const STAFF_ROLE_ID = "1472651115618242615";
const GENERAL_CHANNEL_ID = "1472651116801163336";

/* CLIENT */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
});

/* DATA */

const economy = new Map();
const bank = new Map();
const inventory = new Map();
const spamMap = new Map();

/* SHOP */

const shop={
cookie:{price:50},
diamond:{price:200},
vip:{price:500}
};

/* COMMANDS */

const commands = [

new SlashCommandBuilder()
.setName("balance")
.setDescription("Check your wallet balance"),

new SlashCommandBuilder()
.setName("daily")
.setDescription("Claim your daily coins"),

new SlashCommandBuilder()
.setName("bank")
.setDescription("Check your bank balance"),

new SlashCommandBuilder()
.setName("deposit")
.setDescription("Deposit coins into your bank")
.addIntegerOption(o =>
o.setName("amount")
.setDescription("Amount of coins to deposit")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("withdraw")
.setDescription("Withdraw coins from your bank")
.addIntegerOption(o =>
o.setName("amount")
.setDescription("Amount of coins to withdraw")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("shop")
.setDescription("View shop items"),

new SlashCommandBuilder()
.setName("buy")
.setDescription("Buy an item from the shop")
.addStringOption(o =>
o.setName("item")
.setDescription("Item name to buy")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("sell")
.setDescription("Sell an item from your inventory")
.addStringOption(o =>
o.setName("item")
.setDescription("Item name to sell")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("inventory")
.setDescription("View your inventory items"),

new SlashCommandBuilder()
.setName("trade")
.setDescription("Trade an item with another user")
.addUserOption(o =>
o.setName("user")
.setDescription("User to trade with")
.setRequired(true)
)
.addStringOption(o =>
o.setName("item")
.setDescription("Item you want to trade")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("coinbet")
.setDescription("Bet coins on a coin toss")
.addIntegerOption(o =>
o.setName("amount")
.setDescription("Amount of coins to bet")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("slots")
.setDescription("Play the slot machine")
.addIntegerOption(o =>
o.setName("bet")
.setDescription("Amount of coins to bet")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("blackjack")
.setDescription("Play blackjack")
.addIntegerOption(o =>
o.setName("bet")
.setDescription("Amount of coins to bet")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("mcstatus")
.setDescription("Check Minecraft server status")
.addStringOption(o =>
o.setName("ip")
.setDescription("Minecraft server IP address")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("coinflip")
.setDescription("Flip a coin"),

new SlashCommandBuilder()
.setName("joke")
.setDescription("Tell a random joke"),

new SlashCommandBuilder()
.setName("panel")
.setDescription("Send the ticket panel")

].map(c => c.toJSON());

/* REGISTER COMMANDS */

const rest=new REST({version:"10"}).setToken(TOKEN);

(async()=>{
await rest.put(
Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),
{body:commands}
);
})();

/* READY */

client.on("ready",()=>{

console.log(`Logged in as ${client.user.tag}`);

const guild=client.guilds.cache.get(GUILD_ID);

setInterval(()=>{

const count=guild.memberCount;

const channel=guild.channels.cache.find(c=>c.name.startsWith("👥 Members"));

if(channel) channel.setName(`👥 Members: ${count}`);

},60000);

/* CONSOLE CHAT */

const rl=readline.createInterface({
input:process.stdin,
output:process.stdout
});

rl.on("line",msg=>{
const ch=client.channels.cache.get(GENERAL_CHANNEL_ID);
if(ch) ch.send(`🖥 Console: ${msg}`);
});

});

/* AUTOMOD */

client.on("messageCreate",async m=>{

if(m.author.bot) return;

const now=Date.now();
const data=spamMap.get(m.author.id)||{count:0,last:now};

data.count++;

if(now-data.last>5000) data.count=1;

data.last=now;
spamMap.set(m.author.id,data);

if(data.count>5){
await m.delete().catch(()=>{});
m.channel.send(`⚠️ ${m.author} stop spamming`);
}

if(m.content.includes("http")){
if(!m.member.roles.cache.has(STAFF_ROLE_ID)){
await m.delete().catch(()=>{});
m.channel.send("🚫 Links not allowed");
}
}

});

/* COMMAND HANDLER */

client.on("interactionCreate",async i=>{

if(!i.isChatInputCommand()) return;

const id=i.user.id;

/* BALANCE */

if(i.commandName==="balance"){
const bal=economy.get(id)||0;
return i.reply(`💰 Wallet: ${bal}`);
}

/* DAILY */

if(i.commandName==="daily"){
let bal=economy.get(id)||0;
bal+=100;
economy.set(id,bal);
return i.reply("💵 +100 coins");
}

/* BANK */

if(i.commandName==="bank"){
return i.reply(`🏦 Bank: ${bank.get(id)||0}`);
}

/* DEPOSIT */

if(i.commandName==="deposit"){

const amt=i.options.getInteger("amount");

let bal=economy.get(id)||0;

if(bal<amt) return i.reply("Not enough coins");

bal-=amt;

let b=bank.get(id)||0;
b+=amt;

economy.set(id,bal);
bank.set(id,b);

return i.reply(`🏦 Deposited ${amt}`);

}

/* WITHDRAW */

if(i.commandName==="withdraw"){

const amt=i.options.getInteger("amount");

let bal=economy.get(id)||0;
let b=bank.get(id)||0;

if(b<amt) return i.reply("Not enough bank coins");

b-=amt;
bal+=amt;

bank.set(id,b);
economy.set(id,bal);

return i.reply(`💰 Withdrew ${amt}`);

}

/* SHOP */

if(i.commandName==="shop"){

let text="🛒 Shop\n";

for(const item in shop){
text+=`\n${item} - ${shop[item].price}`;
}

return i.reply(text);

}

/* BUY */

if(i.commandName==="buy"){

const item=i.options.getString("item");

if(!shop[item]) return i.reply("Item not found");

let bal=economy.get(id)||0;

if(bal<shop[item].price) return i.reply("Not enough coins");

bal-=shop[item].price;
economy.set(id,bal);

const inv=inventory.get(id)||[];

inv.push(item);

inventory.set(id,inv);

return i.reply(`✅ Bought ${item}`);

}

/* SELL */

if(i.commandName==="sell"){

const item=i.options.getString("item");

const inv=inventory.get(id)||[];

if(!inv.includes(item)) return i.reply("You don't have this");

inv.splice(inv.indexOf(item),1);

inventory.set(id,inv);

let bal=economy.get(id)||0;

bal+=Math.floor(shop[item].price/2);

economy.set(id,bal);

return i.reply(`💰 Sold ${item}`);

}

/* INVENTORY */

if(i.commandName==="inventory"){

const inv=inventory.get(id)||[];

if(inv.length===0) return i.reply("Inventory empty");

return i.reply(`🎒 ${inv.join(", ")}`);

}

/* TRADE */

if(i.commandName==="trade"){

const user=i.options.getUser("user");
const item=i.options.getString("item");

const inv=inventory.get(id)||[];

if(!inv.includes(item)) return i.reply("You don't have that");

inv.splice(inv.indexOf(item),1);

inventory.set(id,inv);

const other=inventory.get(user.id)||[];

other.push(item);

inventory.set(user.id,other);

return i.reply(`🤝 Traded ${item} to ${user.username}`);

}

/* COIN BET */

if(i.commandName==="coinbet"){

const bet=i.options.getInteger("amount");

let bal=economy.get(id)||0;

if(bal<bet) return i.reply("Not enough coins");

if(Math.random()<0.5){
bal+=bet;
i.reply(`🪙 Won ${bet}`);
}else{
bal-=bet;
i.reply(`💸 Lost ${bet}`);
}

economy.set(id,bal);

}

/* SLOTS */

if(i.commandName==="slots"){

const bet=i.options.getInteger("bet");

let bal=economy.get(id)||0;

if(bal<bet) return i.reply("Not enough coins");

const icons=["🍒","🍋","💎","7️⃣"];

const r1=icons[Math.floor(Math.random()*icons.length)];
const r2=icons[Math.floor(Math.random()*icons.length)];
const r3=icons[Math.floor(Math.random()*icons.length)];

let msg=`${r1} | ${r2} | ${r3}\n`;

if(r1===r2 && r2===r3){
bal+=bet*3;
msg+=`🎉 Jackpot +${bet*3}`;
}else{
bal-=bet;
msg+=`💸 Lost ${bet}`;
}

economy.set(id,bal);

return i.reply(msg);

}

/* BLACKJACK */

if(i.commandName==="blackjack"){

const bet=i.options.getInteger("bet");

let bal=economy.get(id)||0;

if(bal<bet) return i.reply("Not enough coins");

const player=Math.floor(Math.random()*11)+16;
const dealer=Math.floor(Math.random()*11)+16;

let msg=`🃏 Blackjack\nYou: ${player}\nDealer: ${dealer}\n\n`;

if(player>21){
bal-=bet;
msg+="💸 Bust!";
}
else if(dealer>21 || player>dealer){
bal+=bet;
msg+=`🎉 You win ${bet}`;
}
else if(player===dealer){
msg+="🤝 Draw";
}
else{
bal-=bet;
msg+="💸 Dealer wins";
}

economy.set(id,bal);

return i.reply(msg);

}

/* MINECRAFT */

if(i.commandName==="mcstatus"){

const ip=i.options.getString("ip");

try{

const res=await util.status(ip);

return i.reply(`🟢 Online\nPlayers: ${res.players.online}/${res.players.max}`);

}catch{

return i.reply("🔴 Server offline");

}

}

/* FUN */

if(i.commandName==="coinflip"){

return i.reply(Math.random()<0.5?"Heads":"Tails");

}

if(i.commandName==="joke"){

const jokes=[
"Creepers explode because they love you.",
"Villagers be like: hmmmmm.",
"I tried mining bedrock."
];

return i.reply(jokes[Math.floor(Math.random()*jokes.length)]);

}

/* TICKET PANEL */

if(i.commandName==="panel"){

const menu=new StringSelectMenuBuilder()
.setCustomId("ticket_menu")
.setPlaceholder("Select ticket type")
.addOptions([
{label:"Support",value:"support"},
{label:"Report",value:"report"},
{label:"Appeal",value:"appeal"}
]);

const row=new ActionRowBuilder().addComponents(menu);

return i.reply({
content:"🎫 Open a ticket:",
components:[row]
});

}

});

/* TICKET CREATION */

client.on("interactionCreate",async interaction=>{

if(!interaction.isStringSelectMenu()) return;

if(interaction.customId==="ticket_menu"){

const channel=await interaction.guild.channels.create({
name:`ticket-${interaction.user.username}`,
type:ChannelType.GuildText,
permissionOverwrites:[
{
id:interaction.guild.id,
deny:[PermissionsBitField.Flags.ViewChannel]
},
{
id:interaction.user.id,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},
{
id:STAFF_ROLE_ID,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}
]
});

const buttons=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("claim")
.setLabel("Claim")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("close")
.setLabel("Close")
.setStyle(ButtonStyle.Danger)

);

channel.send({
content:`Ticket for ${interaction.user}`,
components:[buttons]
});

interaction.reply({
content:`✅ Ticket created: ${channel}`,
ephemeral:true
});

}

});

/* TICKET BUTTONS */

client.on("interactionCreate",async interaction=>{

if(!interaction.isButton()) return;

if(interaction.customId==="claim"){
interaction.reply("👮 Ticket claimed");
}

if(interaction.customId==="close"){
interaction.reply("Closing ticket...");
setTimeout(()=>interaction.channel.delete(),3000);
}

});

/* LOGIN */

client.login(TOKEN);