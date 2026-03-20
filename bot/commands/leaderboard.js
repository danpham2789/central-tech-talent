const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { buildLeaderboardEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboard"),

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
	};

    await interaction.reply({
      embeds: [buildLeaderboardEmbed()],
	  ephemeral: true
    });
  },

  async executePrefix(message) {
    message.reply({
      embeds: [buildLeaderboardEmbed()],
	  ephemeral: true
    });
  }
};
