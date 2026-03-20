const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");
const { MINICASE_ID } = require("../config.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("update_problem")
		.setDescription("Update the problem statement")
		.addStringOption((option) => option.setName('title').setDescription('The problem title').setRequired(true))
		.addStringOption((option) => option.setName('statement').setDescription('The problem statement').setRequired(true))
		.addStringOption((option) => option.setName('barem').setDescription('The model answer').setRequired(true)),
	
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
		const title = interaction.options.getString('title');
		const statement = interaction.options.getString('statement');
		const barem = interaction.options.getString('barem');

		db.minicase = [ {
			"title": title,
			"statement": statement,
			"barem": barem
		} ];

		db.discord_submissions = [];

		saveDB(db);

		const embed = new EmbedBuilder()
			.setDescription("Problem updated!")
		    .setColor(0x00E5A0)
    		.setTitle("🎉 Update")

		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		});

		const channel = interaction.guild.channels.cache.get(MINICASE_ID);
		if (channel) {
			const embed = new EmbedBuilder()
				.setTitle(`${title}`)
				.setDescription(statement)
				.setColor(0x7FB77E)
				.setTimestamp();
			channel.send({
				embeds: [embed]
			})
		}
	},

	async executePrefix(message) {
		const embed = new EmbedBuilder()
			.setDescription("Use slash command /update_problem instead.");

		message.reply({
			embeds: [embed],
			ephemeral: true
		});
	}

};
