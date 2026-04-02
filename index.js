const fs = require("fs");
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

// =========================
// SERVIDOR WEB (Render)
// =========================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot Discord Online");
});

const PORT = process.env.PORT || 10000;

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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =========================
// PATENTES
// =========================
const rankLimits = {
  "RECRUTA": 0,
  "SOLDADO": 250,
  "CABO": 500,
  "TERCEIRO SARGENTO": 1000,
  "SEGUNDO SARGENTO": 2000,
  "PRIMEIRO SARGENTO": 3500,
  "SUB TENENTE": 4750,
  "ASPIRANTE TENENTE": 6000,
  "SEGUNDO TENENTE": 7000,
  "PRIMEIRO TENENTE": 8750,
  "CAPITÃO": 10000,
  "MAJOR": 11500,
  "TENENTE CORONEL": 13000,
  "CORONEL": 15000,
  "MARECHAL": 30000
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
// CRIAR PLAYER
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
// ATUALIZAR CARGO
// =========================
async function updateRole(member, rank) {

  const roles = Object.keys(rankLimits);

  for (const r of roles) {
    const role = member.guild.roles.cache.find(x => x.name === r);

    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
    }
  }

  const newRole = member.guild.roles.cache.find(x => x.name === rank);

  if (newRole) {
    await member.roles.add(newRole);
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

  // =========================
  // !rank
  // =========================
  if (command === "!rank") {

    const p = players[target.id];

    message.reply(`${target} possui **${p.xp} XP**\nPatente: **${p.rank}**`);
  }

  // =========================
  // !addxp
  // =========================
  else if (command === "!addxp") {

    const qtd = parseInt(args[1]);

    if (isNaN(qtd)) {
      return message.reply("Digite uma quantidade válida!");
    }

    const oldRank = players[target.id].rank;

    players[target.id].xp += qtd;

    const newRank = getRankByXP(players[target.id].xp);

    players[target.id].rank = newRank;

    const member = await message.guild.members.fetch(target.id);

    if (oldRank !== newRank) {

      await updateRole(member, newRank);

      message.reply(
        `${target} recebeu **${qtd} XP**\n🎖 Nova patente: **${newRank}**`
      );

    } else {

      message.reply(`${target} recebeu **${qtd} XP**`);

    }

    savePlayers(players);
  }

  // =========================
  // !resetxp
  // =========================
  else if (command === "!resetxp") {

    players[target.id] = {
      xp: 0,
      rank: "RECRUTA"
    };

    const member = await message.guild.members.fetch(target.id);

    await updateRole(member, "RECRUTA");

    message.reply(`${target} teve o XP resetado.`);

    savePlayers(players);
  }

  // =========================
  // !ranklist
  // =========================
  else if (command === "!ranklist") {

    const list = Object.entries(players)
      .map(([id, data]) => `<@${id}> → ${data.xp} XP → ${data.rank}`)
      .join("\n");

    message.channel.send(list || "Nenhum jogador registrado.");
  }

  // =========================
  // !addxpall
  // =========================
  else if (command === "!addxpall") {

    const qtd = parseInt(args[0]);

    if (isNaN(qtd)) {
      return message.reply("Digite uma quantidade válida!");
    }

    for (const id in players) {

      players[id].xp += qtd;

      const newRank = getRankByXP(players[id].xp);

      players[id].rank = newRank;

      const member = await message.guild.members.fetch(id).catch(()=>null);

      if(member){
        await updateRole(member,newRank);
      }

    }

    message.reply(`Todos receberam **${qtd} XP**`);

    savePlayers(players);
  }

  // =========================
  // !rankinfo
  // =========================
  else if (command === "!rankinfo") {

    const infoXP = Object.entries(rankLimits)
      .map(([rank, xp]) => `${rank} → ${xp} XP`)
      .join("\n");

    const infoMerito = `
GENERAL DE BRIGADA → Mérito Coronel
GENERAL DE DIVISÃO → Mérito Coronel
GENERAL DE CORPO DE EXÉRCITO → Mérito Coronel
`;

    message.channel.send(
      "📜 **Patentes:**\n\n" +
      infoXP +
      "\n" +
      infoMerito
    );
  }

});

// =========================
// LOGIN BOT
// =========================
client.login(process.env.DISCORD_TOKEN);