const { SlashCommandBuilder } = require("discord.js");
const { buildPointsEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("points")
    .setDescription("Check your points"),

  async execute(interaction) {
    await interaction.reply({
      embeds: [buildPointsEmbed(interaction.user.id, interaction.user.username)],
	  ephemeral: true
    });
  },

  async executePrefix(message) {
    message.reply({
      embeds: [buildPointsEmbed(message.author.id, message.author.username)],
      ephemeral: true
    });
  }
};
