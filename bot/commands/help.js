const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x6C63FF)
      .setTitle("⚡ Trany Code Contest Bot")
      .setDescription("Here are all available commands:")
      .addFields(
        {
          name: "🎟 Redeem",
          value: "`/redeem code:<your_code>`\nRedeem a contest code",
          inline: false
        },
        {
          name: "📈 Points",
          value: "`/points`\nCheck your total points",
          inline: false
        },
        {
          name: "🥇 Leaderboard",
          value: "`/leaderboard`\nView top scorers",
          inline: false
        },
		{
          name: "📝 Statement",
		  value: "`/show_statement`\nShow today's problem",
		  inline: false
		},
		{
			name: "✏️ Submit your answer",
			value: "`/submit`\nSubmit answer",
			inline: false
		},
        {
          name: "❓ Help",
          value: "`/help`\nShow this message",
          inline: false
        },
      )
      .setTimestamp();

    await interaction.reply({ 
		embeds: [embed],
		ephemeral: true
	});
  },

  async executePrefix(message) {
    const embed = new EmbedBuilder()
      .setColor(0x6C63FF)
      .setTitle("⚡ Trany Code Contest Bot")
      .setDescription("Here are all available commands:")
      .addFields(
        {
          name: "🎟 Redeem",
          value: "`/redeem code:<your_code>`\n`!redeem TR-XXXX-XXXX`\nRedeem a contest code",
          inline: false
        },
        {
          name: "📊 Points",
          value: "`/points`\n`!points`\nCheck your total points",
          inline: false
        },
        {
          name: "🏆 Leaderboard",
          value: "`/leaderboard`\n`!leaderboard`\nView top scorers",
          inline: false
        },
        {
          name: "❓ Help",
          value: "`/help`\n`!help`\nShow this message",
          inline: false
        }
      )
      .setFooter({ text: "Tip: You can use both slash (/) and prefix (!) commands" })
      .setTimestamp();

    message.reply({ 
		embeds: [embed],
		ephemeral: true
	});
  }
};
