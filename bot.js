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

/* ANTI CRASH */

process.on("uncaughtException", err => {
console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
console.error("Unhandled Rejection:", err);
});

/* CONFIG */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1479616798847406090";
const GUILD_ID = "1453039530503573584";

const STAFF_ROLE_ID = "1474918844840542258";
const LOG_CHANNEL_ID = "1484995600654008320";

const INACTIVE_TIME = 1000 * 60 * 30;

/* CLIENT */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildMembers
]
});

/* COMMANDS */

const commands=[

new SlashCommandBuilder()
.setName("panel")
.setDescription("Open ticket panel")

].map(c=>c.toJSON());

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
});

/* COMMAND */

client.on("interactionCreate",async interaction=>{

if(!interaction.isChatInputCommand()) return;

if(interaction.commandName==="panel"){

const menu=new StringSelectMenuBuilder()
.setCustomId("ticket_menu")
.setPlaceholder("Select ticket type")
.addOptions([
{label:"Support",value:"support"},
{label:"Report User",value:"report"},
{label:"Ban Appeal",value:"appeal"},
{label:"Staff Application",value:"staff"}
]);

const row=new ActionRowBuilder().addComponents(menu);

interaction.reply({
content:"🎫 Open a ticket",
components:[row]
});

}

});

/* MENU */

client.on("interactionCreate",async interaction=>{

if(!interaction.isStringSelectMenu()) return;

if(interaction.customId!=="ticket_menu") return;

const type=interaction.values[0];

/* SUPPORT */

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

/* REPORT */

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

/* APPEAL */

/* APPEAL */

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

/* STAFF APPLICATION */

if(type==="staff"){

const modal=new ModalBuilder()
.setCustomId("staff_form")
.setTitle("Staff Application");

const dcuser=new TextInputBuilder()
.setCustomId("dcuser")
.setLabel("Discord Username")
.setStyle(TextInputStyle.Short);

const mcversion=new TextInputBuilder()
.setCustomId("mcversion")
.setLabel("Minecraft Version")
.setStyle(TextInputStyle.Short);

const why=new TextInputBuilder()
.setCustomId("why")
.setLabel("Why should we pick you?")
.setStyle(TextInputStyle.Paragraph);

modal.addComponents(
new ActionRowBuilder().addComponents(dcuser),
new ActionRowBuilder().addComponents(mcversion),
new ActionRowBuilder().addComponents(why)
);

return interaction.showModal(modal);

}

});

/* MODAL SUBMIT */

client.on("interactionCreate",async interaction=>{

if(!interaction.isModalSubmit()) return;

let text="";
let isStaff=false;

/* SUPPORT */

if(interaction.customId==="support_form"){

text=`🆘 SUPPORT

User: ${interaction.user}

Reason:
${interaction.fields.getTextInputValue("reason")}

Explanation:
${interaction.fields.getTextInputValue("explain")}
`;

}

/* REPORT */

if(interaction.customId==="report_form"){

text=`🚨 REPORT

Reporter: ${interaction.user}

Reported User:
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

Reason:
${interaction.fields.getTextInputValue("reason")}
`;

}

/* STAFF APP */

if(interaction.customId==="staff_form"){

isStaff=true;

text=`🛡 STAFF APPLICATION

Applicant: ${interaction.user}

Discord:
${interaction.fields.getTextInputValue("dcuser")}

Minecraft Version:
${interaction.fields.getTextInputValue("mcversion")}

Why we should pick them:
${interaction.fields.getTextInputValue("why")}
`;

}

/* CREATE CHANNEL */

const channel=await interaction.guild.channels.create({

name:`ticket-${interaction.user.username}-${Math.floor(Math.random()*9999)}`,
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

/* BUTTONS */

let row;

if(isStaff){

row=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("accept_staff")
.setLabel("Accept")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("deny_staff")
.setLabel("Deny")
.setStyle(ButtonStyle.Danger),

new ButtonBuilder()
.setCustomId("close")
.setLabel("Close")
.setStyle(ButtonStyle.Secondary)

);

}else{

row=new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("claim")
.setLabel("Claim")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("close")
.setLabel("Close")
.setStyle(ButtonStyle.Danger)

);

}

channel.send({
content:text,
components:[row]
});

/* LOG */

if(isStaff){

const log=interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

if(log){
log.send(`📂 New staff application from ${interaction.user}`);
}

}

/* AUTO CLOSE */

setTimeout(()=>{

if(channel && channel.deletable){

channel.send("🔒 Ticket closed due to inactivity");

setTimeout(()=>channel.delete(),5000);

}

},INACTIVE_TIME);

interaction.reply({
content:`✅ Ticket created: ${channel}`,
ephemeral:true
});

});

/* BUTTON HANDLER */

client.on("interactionCreate",async interaction=>{

if(!interaction.isButton()) return;

if(interaction.customId==="claim"){
interaction.reply("👮 Ticket claimed");
}

if(interaction.customId==="close"){
interaction.reply("Closing ticket...");
setTimeout(()=>interaction.channel.delete(),3000);
}

if(interaction.customId==="accept_staff"){

interaction.reply("✅ Application accepted");

const log=interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

if(log){
log.send(`✅ Staff application accepted in ${interaction.channel}`);
}

}

if(interaction.customId==="deny_staff"){

interaction.reply("❌ Application denied");

const log=interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

if(log){
log.send(`❌ Staff application denied in ${interaction.channel}`);
}

}

});

/* LOGIN */

client.login(TOKEN); 
