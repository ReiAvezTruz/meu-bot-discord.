const fs = require("fs");
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// =========================
// SERVIDOR WEB (necessário para Render)
// =========================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Discord Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor web ativo na porta " + PORT);
});

// =========================
// CLIENT DISCORD
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// PATENTES
// =========================
const rankLimits = {
  "RECRUTA": 0,
  "SOLDADO": 250,
  "SOLDADO DE PRIMEIRA CLASSE": 500,
  "ESPECIALISTA": 1000,
  "CABO": 2000,
  "SARGENTO": 3500,
  "SARGENTO DE ESQUADRA": 9700,
  "SARGENTO PRIMEIRA CLASSE": 17000,
  "MASTER SARGENTO": 22000,
  "PRIMEIRO SARGENTO": 27000,
  "SARGENTO-MOR": 30000,
  "SARGENTO-MOR DO EXÉRCITO": 35000,
  "SEGUNDO-TENENTE": 40000,
  "PRIMEIRO-TENENTE": 47000,
  "CAPITÃO": 55000,
  "MAJOR": 65000,
  "TENENTE-CORONEL": 70000,
  "CORONEL": 80000,
  "GENERAL DE BRIGADA": 90000,
  "GENERAL DE DIVISÃO": 100000,
  "GENERAL DE CORPO DE EXÉRCITO": 110000,
  "GENERAL DO EXÉRCITO": 500000
};

// =========================
// CARREGAR PLAYERS
// =========================
function loadPlayers() {
  if (!fs.existsSync("players.json")) {
    fs.writeFileSync("players.json", "{}");
  }
  return JSON.parse(fs.readFileSync("players.json", "utf8"));
}

// =========================
// SALVAR PLAYERS
// =========================
function savePlayers(players) {
  fs.writeFileSync("players.json", JSON.stringify(players, null, 2));
}

// =========================
// PEGAR PATENTE POR XP
// =========================
function getRankByXP(xp) {
  const ranks = Object.keys(rankLimits);

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (xp >= rankLimits[ranks[i]]) {
      return ranks[i];
    }
  }

  return "RECRUTA";
}

// =========================
// CRIAR PLAYER SE NÃO EXISTIR
// =========================
function ensurePlayer(players, id) {
  if (!players[id]) {
    players[id] = {
      xp: 0,
      rank: "RECRUTA"
    };
  }
}

// =========================
// BOT PRONTO
// =========================
client.once("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

// =========================
// COMANDOS
// =========================
client.on("messageCreate", async (message) => {

  if (message.author.bot) return;
  if (!message.guild) return;

  const players = loadPlayers();

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const target =
    message.mentions.users.first() ||
    (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null) ||
    message.author;

  ensurePlayer(players, target.id);

  // !rank
  if (command === "!rank") {

    const p = players[target.id];

    message.reply(`${target} possui **${p.xp} XP**\nPatente: **${p.rank}**`);
  }

  // !addxp
  else if (command === "!addxp") {

    const qtd = parseInt(args[1]);

    if (isNaN(qtd)) {
      return message.reply("Digite uma quantidade válida!");
    }

    players[target.id].xp += qtd;
    players[target.id].rank = getRankByXP(players[target.id].xp);

    message.reply(`${target} recebeu **${qtd} XP**\nNova patente: **${players[target.id].rank}**`);
  }

  // !resetxp
  else if (command === "!resetxp") {

    players[target.id] = {
      xp: 0,
      rank: "RECRUTA"
    };

    message.reply(`${target} teve o XP resetado.`);
  }

  // !ranklist
  else if (command === "!ranklist") {

    const list = Object.entries(players)
      .map(([id, data]) => `<@${id}> → ${data.xp} XP → ${data.rank}`)
      .join("\n");

    message.channel.send(list || "Nenhum jogador registrado.");
  }

  // !addxpall
  else if (command === "!addxpall") {

    const qtd = parseInt(args[0]);

    if (isNaN(qtd)) {
      return message.reply("Digite uma quantidade válida!");
    }

    for (const id in players) {
      players[id].xp += qtd;
      players[id].rank = getRankByXP(players[id].xp);
    }

    message.reply(`Todos receberam **${qtd} XP**`);
  }

  // !rankinfo
  else if (command === "!rankinfo") {

    const info = Object.entries(rankLimits)
      .map(([rank, xp]) => `${rank} → ${xp} XP`)
      .join("\n");

    message.channel.send("📜 **Patentes:**\n" + info);
  }

  savePlayers(players);
});

// =========================
// LOGIN BOT
// =========================
client.login(process.env.DISCORD_TOKEN);A