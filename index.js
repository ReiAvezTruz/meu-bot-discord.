const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const app = express();

// servidor web para o Render
app.get("/", (req, res) => {
  res.send("Bot online");
});

app.listen(3000, () => {
  console.log("Servidor web ativo");
});

// criar bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// patentes
const ranks = [
  { name: "Recruta", xp: 0 },
  { name: "Soldado", xp: 100 },
  { name: "Cabo", xp: 250 },
  { name: "Sargento", xp: 500 },
  { name: "Tenente", xp: 1000 },
  { name: "Capitão", xp: 2000 },
  { name: "Major", xp: 3500 },
  { name: "Coronel", xp: 5000 },
  { name: "General", xp: 8000 }
];

// banco simples
let data = {};

if (fs.existsSync("patentes.json")) {
  data = JSON.parse(fs.readFileSync("patentes.json"));
}

function saveData() {
  fs.writeFileSync("patentes.json", JSON.stringify(data, null, 2));
}

// evento mensagem
client.on("messageCreate", message => {

  if (message.author.bot) return;

  const id = message.author.id;

  if (!data[id]) {
    data[id] = {
      xp: 0,
      rank: "Recruta"
    };
  }

  // ganha xp
  data[id].xp += 10;

  let newRank = data[id].rank;

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (data[id].xp >= ranks[i].xp) {
      newRank = ranks[i].name;
      break;
    }
  }

  // promoção
  if (newRank !== data[id].rank) {

    data[id].rank = newRank;

    message.channel.send(
      `${message.author} foi promovido para **${newRank}**`
    );
  }

  saveData();

  // comando rank
  if (message.content === "!rank") {

    message.reply(
      `🎖️ Patente: **${data[id].rank}**\n⭐ XP: ${data[id].xp}`
    );

  }

});

// bot pronto
client.once("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

// verificar token
console.log("TOKEN carregado:", process.env.TOKEN ? "SIM" : "NÃO");

// login
client.login(process.env.TOKEN)
.then(() => {
  console.log("Conectando ao Discord...");
})
.catch(err => {
  console.error("Erro ao logar:", err);
});