const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { TOKEN, PREFIX, WELCOMEID } = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Load commands
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ===== PREFIX COMMANDS =====
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const command = client.commands.get(cmd);
  if (!command || !command.executePrefix) return;

  try {
    await command.executePrefix(message, args);
  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command.");
  }
});

// ===== SLASH COMMANDS =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
  }
});

client.on("guildMemberAdd", (member) => {
	const channel = member.guild.channels.cache.get(WELCOMEID);
	if (!channel) return;
	channel.send(`Welcome to the server, ${member}! 🎉`);
})

client.on("ready", () => {
  console.log(`🤖 Bot online! ${client.user.tag}`);
});

client.login(TOKEN);
