const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("submit_answer")
		.setDescription("Submit the answer to the problem of this week")
		.addStringOption((option) => option.setName('answer').setDescription('Your answer').setRequired(true)),
	
	async execute(interaction) {
		const db = loadDB();

		if (db.minicase.length == 0) {
			const embed = new EmbedBuilder()
				.setDescription("No problem statement found! Please contact your admin")
				.setColor(0xFF5C5C)
				.setTitle("❌ Error");

			await interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
			return;
		}

		const submissionExisted = db.discord_submissions.find(c => c.userId === interaction.user.id);
		if (submissionExisted) {
			const embed = new EmbedBuilder()
				.setDescription("You already submitted an answer!")
				.setColor(0xFF5C5C)
				.setTitle("❌ Error");
			await interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
			return;
		}
		
		db.discord_submissions.push({
			"userId": interaction.user.id,
			"username": interaction.user.username,
			"answer": interaction.options.getString('answer'),
			"grade": 0,
			"timestamp": new Date().toISOString()
		});

		saveDB(db);

		const embed = new EmbedBuilder()
			.setDescription("Answer submitted!")
		    .setColor(0x00E5A0)
    		.setTitle("🎉")


		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		});
	},

	async executePrefix(message) {
		const embed = new EmbedBuilder()
			.setDescription("Use slash command /submit_answer instead.");

		message.reply({
			embeds: [embed],
			ephemeral: true
		});
	}
};

