const { Client, GatewayIntentBits, Colors, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ============================
// ARQUIVOS DE DADOS
// ============================
const XP_FILE = './xp.json';
let xpData = {};
if (fs.existsSync(XP_FILE)) xpData = JSON.parse(fs.readFileSync(XP_FILE));

const patentes = require('./patentes.json'); // lê patentes e XP
const ranks = Object.keys(patentes); // lista de patentes

// ============================
// FUNÇÃO PARA OBTER PATENTE
// ============================
function getRank(xp) {
    let rank = ranks[0];
    for (const r of ranks) {
        if (xp >= patentes[r]) rank = r;
    }
    return rank;
}

// ============================
// FUNÇÃO PARA CRIAR ROLES SE FALTAR
// ============================
async function atualizarPatentes(guild) {
    for (const rankName of ranks) {
        let role = guild.roles.cache.find(r => r.name === rankName);
        if (!role) {
            await guild.roles.create({
                name: rankName,
                color: Colors.Blue,
                permissions: []
            });
            console.log(`Role criada: ${rankName}`);
        }
    }
}

// ============================
// EVENTO READY
// ============================
client.on('ready', async () => {
    console.log(`Bot logado como ${client.user.tag}`);
    client.guilds.cache.forEach(async guild => {
        await atualizarPatentes(guild);
    });
});

// ============================
// COMANDOS
// ============================
client.on('messageCreate', async message => {
    if (!message.guild) return;
    if (message.author.bot) return;

    const args = message.content.split(' ');

    // -----------------------------
    // COMANDO !rank
    // -----------------------------
    if (args[0].toLowerCase() === '!rank') {
        const member = message.mentions.members.first() || message.member;
        const userXP = xpData[member.id] || 0;
        const rank = getRank(userXP);
        return message.reply(`${member.user.username} tem ${userXP} XP e sua patente é ${rank}.`);
    }

    // -----------------------------
    // COMANDO !addxp
    // -----------------------------
    if (args[0].toLowerCase() === '!addxp') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('Você precisa ser administrador.');

        const member = message.mentions.members.first();
        const amount = parseInt(args[2]);
        if (!member || isNaN(amount)) return message.reply('Uso correto: !addxp @usuario quantidade');

        const userId = member.id;
        if (!xpData[userId]) xpData[userId] = 0;
        xpData[userId] += amount;
        fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2));

        // Atualiza role existente
        const newRank = getRank(xpData[userId]);
        let role = message.guild.roles.cache.find(r => r.name === newRank);
        const rolesToRemove = member.roles.cache.filter(r => ranks.includes(r.name) && r.name !== newRank);
        await member.roles.remove(rolesToRemove);
        if (role && !member.roles.cache.has(role.id)) await member.roles.add(role);

        return message.channel.send(`${member.user.username} recebeu ${amount} XP e agora sua patente é ${newRank}.`);
    }

    // -----------------------------
    // COMANDO !resetxp
    // -----------------------------
    if (args[0].toLowerCase() === '!resetxp') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('Você precisa ser administrador.');

        const member = message.mentions.members.first();
        if (!member) return message.reply('Uso correto: !resetxp @usuario');

        xpData[member.id] = 0;
        fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2));

        // Remove todas as roles de patente
        const rolesToRemove = member.roles.cache.filter(r => ranks.includes(r.name));
        await member.roles.remove(rolesToRemove);

        return message.channel.send(`${member.user.username} teve o XP resetado e todas as patentes removidas.`);
    }

    // -----------------------------
    // COMANDO !ranklist
    // -----------------------------
    if (args[0].toLowerCase() === '!ranklist') {
        let list = '📜 **Lista de Patentes e XP:**\n';
        message.guild.members.cache.forEach(member => {
            const userXP = xpData[member.id] || 0;
            const rank = getRank(userXP);
            list += `${member.user.username}: ${rank} (${userXP} XP)\n`;
        });
        return message.channel.send(list);
    }

    // -----------------------------
    // COMANDO !addxpall
    // -----------------------------
    if (args[0].toLowerCase() === '!addxpall') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('Você precisa ser administrador.');
        const amount = parseInt(args[1]);
        if (isNaN(amount)) return message.reply('Uso correto: !addxpall quantidade');

        message.guild.members.cache.forEach(async member => {
            if (member.user.bot) return;
            const userId = member.id;
            if (!xpData[userId]) xpData[userId] = 0;

            xpData[userId] += amount;

            const newRank = getRank(xpData[userId]);
            let role = message.guild.roles.cache.find(r => r.name === newRank);
            const rolesToRemove = member.roles.cache.filter(r => ranks.includes(r.name) && r.name !== newRank);
            await member.roles.remove(rolesToRemove);
            if (role && !member.roles.cache.has(role.id)) await member.roles.add(role);
        });

        fs.writeFileSync(XP_FILE, JSON.stringify(xpData, null, 2));
        return message.channel.send(`Todos os membros receberam ${amount} XP.`);
    }

    // -----------------------------
    // COMANDO !rankinfo
    // -----------------------------
    if (args[0].toLowerCase() === '!rankinfo') {
        const embed = new EmbedBuilder()
            .setTitle('📜 SISTEMA DE PATENTES - EXÉRCITO DOS EUA')
            .setColor(Colors.Gold)
            .setDescription('Lista de patentes e XP necessário');

        for (let i = 0; i < ranks.length; i++) {
            embed.addFields({ name: ranks[i], value: `XP necessário: ${patentes[ranks[i]]}`, inline: false });
        }

        return message.channel.send({ embeds: [embed] });
    }
});

// ============================
// LOGIN DO BOT
// ============================
client.login(process.env.TOKEN);