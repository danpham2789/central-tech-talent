const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("get_submission")
	.setDescription("Get a person's submission.")
	.addUserOption((option) => option.setName("userid").setDescription("The person you want to see the submission.").setRequired(true)),

  async execute(interaction) {
	// check for admin
	const member = interaction.member;
	const hasAdminRole = member.roles.cache.some(role => role.name === "Admin");
	if (!hasAdminRole) {
		const embed = new EmbedBuilder()
			.setDescription("You must have the admin role to use this command.")
			.setColor(0xFF5C5C)
			.setTitle("❌ Error");
		return interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
	}

	const db = loadDB();
    
	const minicase = db.minicase;
	if (!minicase.length) {
		const embed = new EmbedBuilder()
			.setDescription("No problem existed! Please add a problem first.")
			.setColor(0xFF5C5C)
			.setTitle("❌ Error")
		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
		return;
	}
	  
	const user = interaction.options.getUser("userid");

	const submission = db.discord_submissions.find(d => d.userId === user.id);
	if (!submission) {
		const embed = new EmbedBuilder()
			.setDescription("User haven't submitted yet!")
			.setColor(0xFF5C5C)
			.setTitle("❌ Error");
		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
		return;
	}

	const embed = new EmbedBuilder()
		.setDescription(submission.answer)
	  	.setColor(0x00E5A0)
	  	.setTitle("Submission");

    await interaction.reply({
		embeds: [embed],
		ephemeral: true
    });
  },

  async executePrefix(message) {
	const embed = new EmbedBuilder()
		.setDescription("Please use slash command /get_submission instead.");
    message.reply({
      embeds: [embed],
	  ephemeral: true
    });
  }
};

