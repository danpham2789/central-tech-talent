const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { TOKEN, CLIENT_ID, GUILD_ID } = require("./config");

async function register() {
  const commands = [];

  const commandFiles = fs
    .readdirSync(path.join(__dirname, "commands"))
    .filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("📝 Registering slash commands...");
    await rest.put(
		Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commands registered!");
  } catch (err) {
    console.error(err);
  }
}

register();
