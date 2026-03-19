const { SlashCommandBuilder } = require("discord.js");
const { buildLeaderboardEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboard"),

  async execute(interaction) {
    await interaction.reply({
      embeds: [buildLeaderboardEmbed()]
    });
  },

  async executePrefix(message) {
    message.reply({
      embeds: [buildLeaderboardEmbed()]
    });
  }
};
