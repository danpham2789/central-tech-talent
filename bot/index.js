const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { TOKEN, PREFIX, WELCOMEID, TECH } = require("./config");

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

client.on("guildMemberAdd", async (member) => {
	const channel = member.guild.channels.cache.get(WELCOMEID);
	if (!channel) return;

	const role = member.guild.roles.cache.get(TECH);
	if (role) {
		try {
			await member.roles.add(role);
		} catch(error) {
			console.error("Failed to add role:", error);
		}
	}

	channel.send(`
		📢 [WELCOME TO CENTRAL TECH TALENT]

		Chào mừng ${member.displayName} đến với Central Tech Talent – Nơi bạn tạo dấu ấn trước khi ứng tuyển.

		Đây là community dành cho Tech Talent miền Trung, giúp bạn thể hiện năng lực thực tế và được doanh nghiệp ghi nhận trước khi apply.

		✨ Tại đây, bạn có thể:
		• Tham gia challenge / task thực tế
		• Nhận feedback từ mentor & recruiter
		• Xây dựng profile & portfolio cá nhân
		• Tăng cơ hội được doanh nghiệp chú ý & recommend sớm

		🚀 Bắt đầu ngay:
		→ Khám phá #minicase hoặc #hackathon hoặc #bounty-hunter
		→ Giới thiệu bản thân tại #conversation

		💬 Nếu cần hỗ trợ, đừng ngại nhắn admin nhé!
	`)
})

client.on("ready", () => {
  console.log(`🤖 Bot online! ${client.user.tag}`);
});

client.login(TOKEN);
