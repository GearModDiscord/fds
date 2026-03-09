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
PermissionsBitField,
ModalBuilder,
TextInputBuilder,
TextInputStyle
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

const commands=[

new SlashCommandBuilder().setName("balance").setDescription("Check balance"),
new SlashCommandBuilder().setName("daily").setDescription("Daily coins"),
new SlashCommandBuilder().setName("bank").setDescription("Bank balance"),

new SlashCommandBuilder()
.setName("deposit")
.setDescription("Deposit coins")
.addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder()
.setName("withdraw")
.setDescription("Withdraw coins")
.addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder().setName("shop").setDescription("View shop"),

new SlashCommandBuilder()
.setName("buy")
.setDescription("Buy item")
.addStringOption(o=>o.setName("item").setRequired(true)),

new SlashCommandBuilder()
.setName("sell")
.setDescription("Sell item")
.addStringOption(o=>o.setName("item").setRequired(true)),

new SlashCommandBuilder().setName("inventory").setDescription("Inventory"),

new SlashCommandBuilder()
.setName("trade")
.setDescription("Trade item")
.addUserOption(o=>o.setName("user").setRequired(true))
.addStringOption(o=>o.setName("item").setRequired(true)),

new SlashCommandBuilder()
.setName("coinbet")
.setDescription("Coin bet")
.addIntegerOption(o=>o.setName("amount").setRequired(true)),

new SlashCommandBuilder()
.setName("slots")
.setDescription("Slots")
.addIntegerOption(o=>o.setName("bet").setRequired(true)),

new SlashCommandBuilder()
.setName("blackjack")
.setDescription("Blackjack")
.addIntegerOption(o=>o.setName("bet").setRequired(true)),

new SlashCommandBuilder()
.setName("mcstatus")
.setDescription("Check Minecraft server")
.addStringOption(o=>o.setName("ip").setRequired(true)),

new SlashCommandBuilder().setName("coinflip").setDescription("Flip coin"),
new SlashCommandBuilder().setName("joke").setDescription("Tell joke"),
new SlashCommandBuilder().setName("panel").setDescription("Ticket panel")

].map(c=>c.toJSON());

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

/* COMMANDS */

client.on("interactionCreate",async i=>{

if(!i.isChatInputCommand()) return;

const id=i.user.id;

/* PANEL */

if(i.commandName==="panel"){

const menu=new StringSelectMenuBuilder()
.setCustomId("ticket_menu")
.setPlaceholder("Select ticket type")
.addOptions([
{label:"Support",value:"support"},
{label:"Report User",value:"report"},
{label:"Ban Appeal",value:"appeal"}
]);

const row=new ActionRowBuilder().addComponents(menu);

return i.reply({
content:"🎫 Open a ticket",
components:[row]
});

}

});

/* TICKET MENU */

client.on("interactionCreate",async interaction=>{

if(interaction.isStringSelectMenu()){

if(interaction.customId!=="ticket_menu") return;

const type=interaction.values[0];

/* SUPPORT FORM */

if(type==="support"){

const modal=new ModalBuilder()
.setCustomId("support_form")
.setTitle("Support Ticket");

const reason=new TextInputBuilder()
.setCustomId("reason")
.setLabel("Support reason")
.setStyle(TextInputStyle.Short);

const explain=new TextInputBuilder()
.setCustomId("explain")
.setLabel("Explain your issue")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(reason),
new ActionRowBuilder().addComponents(explain)
);

return interaction.showModal(modal);

}

/* REPORT FORM */

if(type==="report"){

const modal=new ModalBuilder()
.setCustomId("report_form")
.setTitle("Report User");

const user=new TextInputBuilder()
.setCustomId("user")
.setLabel("User you are reporting")
.setStyle(TextInputStyle.Short);

const reason=new TextInputBuilder()
.setCustomId("reason")
.setLabel("Report reason")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(user),
new ActionRowBuilder().addComponents(reason)
);

return interaction.showModal(modal);

}

/* APPEAL FORM */

if(type==="appeal"){

const modal=new ModalBuilder()
.setCustomId("appeal_form")
.setTitle("Ban Appeal");

const version=new TextInputBuilder()
.setCustomId("version")
.setLabel("Java or Bedrock")
.setStyle(TextInputStyle.Short);

const banid=new TextInputBuilder()
.setCustomId("banid")
.setLabel("Ban ID")
.setStyle(TextInputStyle.Short);

const reason=new TextInputBuilder()
.setCustomId("reason")
.setLabel("Why should you be unbanned")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(version),
new ActionRowBuilder().addComponents(banid),
new ActionRowBuilder().addComponents(reason)
);

return interaction.showModal(modal);

}

}

});

/* FORM SUBMIT */

client.on("interactionCreate",async interaction=>{

if(!interaction.isModalSubmit()) return;

let text="";

/* SUPPORT */

if(interaction.customId==="support_form"){

text=`🆘 SUPPORT

User: ${interaction.user}

Reason: ${interaction.fields.getTextInputValue("reason")}

Explanation:
${interaction.fields.getTextInputValue("explain")}
`;

}

/* REPORT */

if(interaction.customId==="report_form"){

text=`🚨 REPORT

Reporter: ${interaction.user}

Reported user:
${interaction.fields.getTextInputValue("user")}

Reason:
${interaction.fields.getTextInputValue("reason")}
`;

}

/* APPEAL */

if(interaction.customId==="appeal_form"){

text=`📩 BAN APPEAL

User: ${interaction.user}

Version:
${interaction.fields.getTextInputValue("version")}

Ban ID:
${interaction.fields.getTextInputValue("banid")}

Reason:
${interaction.fields.getTextInputValue("reason")}
`;

}

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
content:text,
components:[buttons]
});

interaction.reply({
content:`✅ Ticket created: ${channel}`,
ephemeral:true
});

});

/* BUTTONS */

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
