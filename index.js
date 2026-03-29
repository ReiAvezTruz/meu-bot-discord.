const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

app.get("/", (req, res) => {
  res.send("Bot online!");
});

app.listen(3000, () => {
  console.log("Servidor web ativo");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

client.on("guildMemberAdd", (member) => {
  console.log(`Novo membro entrou: ${member.user.tag}`);
});

const token = process.env.TOKEN;

if (!token) {
  console.log("TOKEN NÃO ENCONTRADO!");
} else {
  console.log("TOKEN carregado: SIM");
  client.login(token);
}