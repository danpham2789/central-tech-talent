// ===== TRANY CODE CONTEST - Discord Bot =====
// Usage: set DISCORD_BOT_TOKEN=your_token  &&  set DISCORD_CLIENT_ID=your_id  &&  node bot.js

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { loadDB, saveDB } = require('./database');
require("dotenv").config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

if (!TOKEN) {
  console.error('❌ Set DISCORD_BOT_TOKEN environment variable!');
  console.log('   Windows:  set DISCORD_BOT_TOKEN=your_token_here');
  console.log('   Then run: node bot.js');
  process.exit(1);
}

const PREFIX = '!';
const client = new Client({
  // IMPORTANT: Enable "Message Content Intent" in Discord Developer Portal > Bot > Privileged Intents
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder().setName('redeem').setDescription('Redeem a point code from Trany Code Contest')
      .addStringOption(o => o.setName('code').setDescription('Your point code (e.g. TR-XXXX-XXXX)').setRequired(true)),
    new SlashCommandBuilder().setName('points').setDescription('Check your total points'),
    new SlashCommandBuilder().setName('leaderboard').setDescription('View the top scorers'),
  ].map(c => c.toJSON());

  if (CLIENT_ID) {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
      console.log('📝 Registering slash commands...');
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('✅ Commands registered!');
    } catch (e) { console.error('Register error:', e.message); }
  } else {
    console.log('⚠️  Set DISCORD_CLIENT_ID to register slash commands.');
  }
}

// ===== SHARED LOGIC =====
function redeemCode(code, userId, username) {
  const db = loadDB();
  const pc = db.point_codes.find(c => c.code === code);
  if (!pc) return { error: 'not_found', code };
  if (pc.redeemed) return { error: 'already_redeemed', by: pc.discord_username || 'someone' };

  // ONE CODE PER USER: check if this user already redeemed any code
  const alreadyUsed = db.point_codes.find(c => c.redeemed && c.discord_user_id === userId);
  if (alreadyUsed) return { error: 'user_limit', existingCode: alreadyUsed.code };

  pc.redeemed = true;
  pc.discord_user_id = userId;
  pc.discord_username = username;
  pc.redeemed_at = new Date().toISOString();

  let dp = db.discord_points.find(d => d.discord_user_id === userId);
  if (dp) {
    dp.total_points += pc.total_score;
    dp.codes_redeemed += 1;
    dp.discord_username = username;
    dp.last_redeemed_at = new Date().toISOString();
  } else {
    dp = { discord_user_id: userId, discord_username: username, total_points: pc.total_score, codes_redeemed: 1, last_redeemed_at: new Date().toISOString() };
    db.discord_points.push(dp);
  }
  saveDB(db);
  return { success: true, pc, dp };
}

function buildRedeemEmbed(result) {
  if (result.error === 'not_found') return new EmbedBuilder().setColor(0xFF5C5C).setTitle('❌ Invalid Code').setDescription(`Code \`${result.code}\` not found.\nMake sure you copied it correctly!`);
  if (result.error === 'already_redeemed') return new EmbedBuilder().setColor(0xFFB443).setTitle('⚠️ Already Redeemed').setDescription(`This code was redeemed by **${result.by}**.`);
  if (result.error === 'user_limit') return new EmbedBuilder().setColor(0xFF5C5C).setTitle('🚫 Limit Reached').setDescription(`You have already redeemed a code (\`${result.existingCode}\`).\nEach user can only redeem **one code**.`);
  return new EmbedBuilder().setColor(0x00E5A0).setTitle('🎉 Code Redeemed!')
    .setDescription(`You earned **${result.pc.total_score} points**!`)
    .addFields(
      { name: '📋 Score', value: `${result.pc.total_score} / ${result.pc.max_score}`, inline: true },
      { name: '👤 Contestant', value: result.pc.participant_name, inline: true },
      { name: '🏆 Your Total', value: `**${result.dp.total_points} points**`, inline: true },
    ).setFooter({ text: `Code: ${result.pc.code}` }).setTimestamp();
}

function buildPointsEmbed(userId, username) {
  const db = loadDB();
  const dp = db.discord_points.find(d => d.discord_user_id === userId);
  if (!dp) return new EmbedBuilder().setColor(0x3DACFF).setTitle('📊 Your Points').setDescription('You haven\'t redeemed any codes yet!\nUse `!redeem CODE` after completing a contest.');
  return new EmbedBuilder().setColor(0x6C63FF).setTitle(`📊 ${username}'s Points`)
    .addFields(
      { name: '🏆 Total Points', value: `**${dp.total_points}**`, inline: true },
      { name: '🎫 Codes Used', value: `${dp.codes_redeemed}`, inline: true },
    );
}

function buildLeaderboardEmbed() {
  const db = loadDB();
  const lb = [...db.discord_points].sort((a, b) => b.total_points - a.total_points).slice(0, 15);
  if (!lb.length) return new EmbedBuilder().setColor(0xFFB443).setTitle('🏆 Leaderboard').setDescription('No one has redeemed codes yet. Be the first!');
  const medals = ['🥇', '🥈', '🥉'];
  const lines = lb.map((u, i) => `${medals[i] || `\`${i + 1}.\``} **${u.discord_username}** — ${u.total_points} pts (${u.codes_redeemed} contests)`);
  return new EmbedBuilder().setColor(0xFFD700).setTitle('🏆 Leaderboard').setDescription(lines.join('\n')).setTimestamp();
}

// ===== PREFIX COMMANDS (copy-paste friendly!) =====
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  if (cmd === 'redeem') {
    const code = (args[0] || '').toUpperCase().trim();
    if (!code) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF5C5C).setTitle('❌ Missing Code').setDescription('Usage: `!redeem TR-XXXX-XXXX`')] });
    const result = redeemCode(code, message.author.id, message.author.username);
    return message.reply({ embeds: [buildRedeemEmbed(result)] });
  }

  if (cmd === 'points') {
    return message.reply({ embeds: [buildPointsEmbed(message.author.id, message.author.username)] });
  }

  if (cmd === 'leaderboard' || cmd === 'lb') {
    return message.reply({ embeds: [buildLeaderboardEmbed()] });
  }

  if (cmd === 'help') {
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x6C63FF).setTitle('⚡ Trany Code Contest Bot')
        .setDescription('**Commands:**\n`!redeem TR-XXXX-XXXX` — Redeem a point code\n`!points` — Check your points\n`!leaderboard` — View top scorers\n`!help` — Show this message')
        .setFooter({ text: 'Just copy-paste your code!' })]
    });
  }
});

// ===== SLASH COMMANDS (still work too) =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'redeem') {
    const code = interaction.options.getString('code').toUpperCase().trim();
    const result = redeemCode(code, interaction.user.id, interaction.user.username);
    return interaction.reply({ embeds: [buildRedeemEmbed(result)], ephemeral: !!result.error });
  }
  if (interaction.commandName === 'points') {
    return interaction.reply({ embeds: [buildPointsEmbed(interaction.user.id, interaction.user.username)] });
  }
  if (interaction.commandName === 'leaderboard') {
    return interaction.reply({ embeds: [buildLeaderboardEmbed()] });
  }
});

client.on('ready', () => {
  console.log(`\n🤖 Trany Bot online! ${client.user.tag}`);
  console.log(`   Prefix commands: !redeem, !points, !leaderboard, !help`);
  console.log(`   Slash commands:  /redeem, /points, /leaderboard\n`);
});

registerCommands();
client.login(TOKEN);
