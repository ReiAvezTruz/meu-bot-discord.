const fs = require("fs");
const express = require("express");
const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot Online");
});

app.listen(PORT, () => {
  console.log("Servidor web ativo porta " + PORT);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let players = {};

if (fs.existsSync("players.json")) {
  players = JSON.parse(fs.readFileSync("players.json"));
}

async function savePlayers() {

  fs.writeFileSync("players.json", JSON.stringify(players, null, 2));

  try {

    const content = Buffer
      .from(JSON.stringify(players, null, 2))
      .toString("base64");

    const res = await axios.get(
      "https://api.github.com/repos/ReiAvezTruz/meu-bot-discord/contents/players.json",
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    await axios.put(
      "https://api.github.com/repos/ReiAvezTruz/meu-bot-discord/contents/players.json",
      {
        message: "update players",
        content: content,
        sha: res.data.sha
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        }
      }
    );

    console.log("players.json atualizado no GitHub");

  } catch (err) {

    console.log("Erro ao atualizar GitHub");

  }

}

const ranks = [
{ name: "RECRUTA", xp: 0 },
{ name: "SOLDADO", xp: 250 },
{ name: "CABO", xp: 500 },
{ name: "TERCEIRO SARGENTO", xp: 1000 },
{ name: "SEGUNDO SARGENTO", xp: 2000 },
{ name: "PRIMEIRO SARGENTO", xp: 3500 },
{ name: "SUB TENENTE", xp: 4750 },
{ name: "ASPIRANTE TENENTE", xp: 6000 },
{ name: "SEGUNDO TENENTE", xp: 7000 },
{ name: "PRIMEIRO TENENTE", xp: 8750 },
{ name: "CAPITÃO", xp: 10000 },
{ name: "MAJOR", xp: 11500 },
{ name: "TENENTE CORONEL", xp: 13000 },
{ name: "CORONEL", xp: 15000 },
{ name: "MARECHAL", xp: 30000 }
];

function getRank(xp) {

  let rank = ranks[0].name;

  for (let i = 0; i < ranks.length; i++) {

    if (xp >= ranks[i].xp) {
      rank = ranks[i].name;
    }

  }

  return rank;

}

client.once("clientReady", () => {

  console.log(`Bot logado como ${client.user.tag}`);

});

client.on("messageCreate", async message => {

if (message.author.bot) return;

const args = message.content.split(" ");
const cmd = args[0].toLowerCase();

if(message.content.startsWith("!")){
message.delete().catch(()=>{});
}

if (cmd === "!rank") {

let user = message.mentions.users.first() || message.author;

if (!players[user.id]) players[user.id] = { xp: 0 };

let xp = players[user.id].xp;
let rank = getRank(xp);

message.channel.send(`**${user.username}**

XP: ${xp}
Patente: ${rank}`);

}

if (cmd === "!addxp") {

if (!message.member.permissions.has("Administrator")) return;

let user = message.mentions.users.first();
let amount = parseInt(args[2]);

if (!user || isNaN(amount)) return;

if (!players[user.id]) players[user.id] = { xp: 0 };

players[user.id].xp += amount;

await savePlayers();

message.channel.send(`${amount} XP adicionado para ${user.username}`);

}

if (cmd === "!addxps") {

if (!message.member.permissions.has("Administrator")) return;

let user = message.mentions.users.first();
let amount = parseInt(args[2]);

if (!user || isNaN(amount)) return;

if (!players[user.id]) players[user.id] = { xp: 0 };

players[user.id].xp += amount;

await savePlayers();

}

if (cmd === "!addxpall") {

if (!message.member.permissions.has("Administrator")) return;

let amount = parseInt(args[1]);

if (isNaN(amount)) return;

for (let id in players) {

players[id].xp += amount;

}

await savePlayers();

message.channel.send(`Todos receberam ${amount} XP`);

}

if (cmd === "!resetxp") {

if (!message.member.permissions.has("Administrator")) return;

let user = message.mentions.users.first();

if (!user) return;

players[user.id] = { xp: 0 };

await savePlayers();

message.channel.send(`XP resetado para ${user.username}`);

}

if (cmd === "!ranklist") {

let lista = "**LISTA DE PATENTES**\n\n";

const sortedRanks = [...ranks].sort((a,b)=>a.xp-b.xp);

sortedRanks.forEach(r => {

lista += `${r.name} — ${r.xp} XP\n`;

});

lista += `

GENERAL DE BRIGADA — Mérito Coronel
GENERAL DE DIVISÃO — Mérito Coronel
GENERAL DE CORPO DE EXÉRCITO — Mérito Coronel`;

message.channel.send(lista);

}

if (cmd === "!rankinfo") {

message.channel.send(`
Sistema de progressão do servidor

Ganhe XP participando de missões.

Use !rank para ver sua patente.
Use !ranklist para ver todas patentes.
Use !topxp para ver o ranking do servidor.
`);

}

if (cmd === "!topxp") {

let lista = Object.entries(players)
.map(([id,data]) => ({
id:id,
xp:data.xp,
rank:getRank(data.xp)
}))
.sort((a,b)=>b.xp-a.xp);

if(lista.length === 0){
return message.channel.send("Nenhum jogador registrado.");
}

let texto = "🏆 **═══ TOP XP DO SERVIDOR ═══** 🏆\n\n";

lista.forEach((p,index)=>{

let medal = "🏅";

if(index===0) medal="🥇";
if(index===1) medal="🥈";
if(index===2) medal="🥉";

texto += `${medal} **${index+1}º** <@${p.id}> — **${p.xp} XP** — **${p.rank}**\n`;

});

message.channel.send(texto);

}

}); // ← FECHA messageCreate

client.login(TOKEN);