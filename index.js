const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
const TOKEN = process.env.TOKEN;

const messageCache = new Map();

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} is online!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const member = message.member;
                // ===== Commands =====

if (message.content === "!ping") {
    return message.reply("🏓 Pong!");
}

if (message.content === "!help") {
    return message.reply(`
🛡️ **FuzzGuard Commands**

!ping - Check bot latency
!help - Show commands
!serverinfo - Server information
!userinfo - Your information
!avatar - Show your avatar
`);
}

if (message.content === "!serverinfo") {
    return message.reply(
        `📊 **${message.guild.name}**
Members: ${message.guild.memberCount}
Owner: <@${message.guild.ownerId}>`
    );
}

if (message.content === "!userinfo") {
    return message.reply(
        `👤 **${message.author.tag}**
ID: ${message.author.id}
Joined: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
    );
}

if (message.content === "!avatar") {
    return message.reply(message.author.displayAvatarURL({ size: 1024 }));
}

if (message.content.startsWith("!clear")) {
    ...
}

if (message.content.startsWith("!kick")) {
    ...
}

if (message.content.startsWith("!ban")) {
    ...
}

if (message.content.startsWith("!timeout")) {
    ...
}

if (message.content.startsWith("!say")) {
    ...
}

    // Skip moderators
    if (member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return;
    }

    const joinTime = Date.now() - member.joinedTimestamp;
    const isNewMember = joinTime < 10 * 60 * 1000;

    // Block images from new members
    if (isNewMember && message.attachments.size > 0) {
        await message.delete().catch(() => {});
        return message.channel.send(
            `${message.author}, you cannot send images for your first 10 minutes.`
        ).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    // Block links from new members
    const linkRegex = /(https?:\/\/|discord\.gg\/)/i;

    if (isNewMember && linkRegex.test(message.content)) {
        await message.delete().catch(() => {});
        return;
    }

    // Anti-spam
    const userId = message.author.id;

    if (!messageCache.has(userId)) {
        messageCache.set(userId, []);
    }

    const messages = messageCache.get(userId);

    messages.push(Date.now());

    const recent = messages.filter(
        time => Date.now() - time < 5000
    );

    messageCache.set(userId, recent);

    if (recent.length >= 6) {
        try {
            await message.member.timeout(
                10 * 60 * 1000,
                'Automatic spam protection'
            );

            const logChannel = message.guild.channels.cache.find(
                c => c.name === 'fuzzguard-logs'
            );

            if (logChannel) {
                logChannel.send(
                    `🚨 ${message.author.tag} was timed out for spam.`
                );
            }

            await message.channel.send(
                `🚨 ${message.author} has been timed out for spamming.`
            );

        } catch (err) {
            console.error(err);
        }
    }
});

client.on('guildMemberAdd', member => {
    const logChannel = member.guild.channels.cache.find(
        c => c.name === 'fuzzguard-logs'
    );

    if (logChannel) {
        logChannel.send(
            `📥 ${member.user.tag} joined the server.`
        );
    }
});

client.login(TOKEN);