const { SlashCommandBuilder } = require("discord.js");
const { redeemCode } = require("../utils/redeemLogic");
const { buildRedeemEmbed } = require("../utils/embeds");
const { modifyRank } = require("../utils/modifyRank");

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
	modifyRank(interaction, interaction.user.id);

    await interaction.reply({
      embeds: [buildRedeemEmbed(result)],
      ephemeral: true
    });
  },

  async executePrefix(message, args) {
	const embed = new EmbedBuilder()
		.setDescription("Please use slash command /redeem instead.");
    message.reply({
      embeds: [embed],
	  ephemeral: true
    });

  }
};
