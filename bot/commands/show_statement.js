const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("show_statement")
	.setDescription("Show today's problem statement"),

  async execute(interaction) {
	const db = loadDB();
    
	const minicase = db.minicase;

	if (!minicase.length) {
		const embed = new EmbedBuilder()
			.setDescription("No problem existed! Please contact your admin")
			.setColor(0xFF5C5C)
			.setTitle("❌ Error");

		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
		return;
	}

	const statement = minicase[0].statement;
	  const embed = new EmbedBuilder()
	  	.setDescription(statement)
	    .setColor(0x00E5A0)
	    .setTitle("📊 Statement")


    await interaction.reply({
		embeds: [embed],
		ephemeral: true
    });
  },

  async executePrefix(message) {
	const embed = new EmbedBuilder()
		.setDescription("Please use slash command /show_statement instead.");
    message.reply({
      embeds: [embed],
	  ephemeral: true
    });
  }
};


