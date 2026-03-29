const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const app = express();

app.get("/", (req, res) => {
  res.send("Bot online");
});

app.listen(3000, () => {
  console.log("Servidor web ativo");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

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

let data = {};

if (fs.existsSync("patentes.json")) {
  data = JSON.parse(fs.readFileSync("patentes.json"));
}

function saveData() {
  fs.writeFileSync("patentes.json", JSON.stringify(data, null, 2));
}

client.on("messageCreate", message => {
  if (message.author.bot) return;

  const id = message.author.id;

  if (!data[id]) {
    data[id] = {
      xp: 0,
      rank: "Recruta"
    };
  }

  data[id].xp += 10;

  let newRank = data[id].rank;

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (data[id].xp >= ranks[i].xp) {
      newRank = ranks[i].name;
      break;
    }
  }

  if (newRank !== data[id].rank) {
    data[id].rank = newRank;
    message.channel.send(
      `${message.author} foi promovido para **${newRank}**`
    );
  }

  saveData();

  if (message.content === "!rank") {
    message.reply(
      `Patente: **${data[id].rank}**\nXP: ${data[id].xp}`
    );
  }
});

client.once("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

client.login(process.env.TOKEN);