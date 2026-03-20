const { SlashCommandBuilder, EmbedBuilder, bold } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");
const { HACKATHON_ID } = require("../config.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("update_hackathon")
		.setDescription("Update the hackathon")
		.addStringOption((option) => option.setName('title').setDescription('The hackathon title').setRequired(true))
		.addStringOption((option) => option.setName('summary').setDescription('The general information').setRequired(true))
		.addStringOption((option) => option.setName('deadline').setDescription('The hackathon deadline').setRequired(true))
		.addStringOption((option) => option.setName('start_time').setDescription('The starting time').setRequired(true))
		.addStringOption((option) => option.setName('link').setDescription('The registration link').setRequired(true))
		.addStringOption((option) => option.setName('requirement').setDescription('Requirements to join this hackathon').setRequired(true)),
	
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
		const summary = interaction.options.getString('summary');
		const deadline = interaction.options.getString('deadline');
		const start_time = interaction.options.getString('start_time');
		const link = interaction.options.getString('link');
		const requirement = interaction.options.getString('requirement');

		db.hackathon = [ {
			"title": title,
			"summary": summary,
			"deadline": deadline,
			"start_time": start_time,
			"link": link,
			"requirement": requirement
		} ];

		saveDB(db);

		const embed = new EmbedBuilder()
			.setDescription("Hackathon updated!")
		    .setColor(0x00E5A0)
    		.setTitle("🎉 Update")

		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		});

		const channel = interaction.guild.channels.cache.get(HACKATHON_ID);
		if (channel) {
			const embed = new EmbedBuilder()
				.setTitle(`${title}`)
				.setDescription(`${bold("Summary")}: ${summary}\n ${bold("Deadline")}: ${deadline}\n ${bold("Starting time")}: ${start_time}\n ${bold("Link")}: ${link}\n ${bold("Requirements")}: ${requirement}\n`)
				.setColor(0x2FA4D7)
				.setTimestamp();
			channel.send({
				embeds: [embed]
			})
		}
	},

	async executePrefix(message) {
		const embed = new EmbedBuilder()
			.setDescription("Use slash command /update_hackathon instead.");

		message.reply({
			embeds: [embed],
			ephemeral: true
		});
	}

};

