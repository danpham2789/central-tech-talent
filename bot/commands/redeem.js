const { SlashCommandBuilder } = require("discord.js");
const { redeemCode } = require("../utils/redeemLogic");
const { buildRedeemEmbed } = require("../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Redeem a code")
    .addStringOption(o =>
      o.setName("code").setDescription("Your code").setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString("code").toUpperCase().trim();
    const result = redeemCode(code, interaction.user.id, interaction.user.username);

    await interaction.reply({
      embeds: [buildRedeemEmbed(result)],
      ephemeral: !!result.error
    });
  },

  async executePrefix(message, args) {
    const code = (args[0] || "").toUpperCase().trim();
    const result = redeemCode(code, message.author.id, message.author.username);

    message.reply({ embeds: [buildRedeemEmbed(result)] });
  }
};
