const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { loadDB, saveDB } = require("../../database.js");
const { modifyRank } = require("../utils/modifyRank.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("grade")
	.setDescription("Grade a person's answer.")
	.addUserOption((option) => option.setName("userid").setDescription("The person you want to grade.").setRequired(true))
	.addNumberOption((option) => option.setName("grade").setDescription("Set their grade").setRequired(true)),

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
			.setDescription("No problem existed! Please add a problem first")
			.setColor(0xFF5C5C)
			.setTitle("❌ Error");
		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
		return;
	}
	  
	const user = interaction.options.getUser("userid");
	const grade = interaction.options.getNumber("grade");

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

	let dp = db.discord_points.find(d => d.discord_user_id === user.id);
	if (!dp) {
		dp = {
			discord_user_id: user.id,
			discord_username: user.username,
			total_points: grade,
			codes_redeemed: 0,
			last_redeemed_at: null
		}
		db.discord_points.push(dp);
	} else {
		dp.total_points += grade;
	}

	saveDB(db);
	modifyRank(interaction, user.id)

	embed = new EmbedBuilder()
		.setDescription(`User ${user.username} graded!`)
		.setColor(0x00E5A0)
    	.setTitle("🎉 Graded!")

	
    await interaction.reply({
		embeds: [embed],
		ephemeral: true
    });
  },

  async executePrefix(message) {
	const embed = new EmbedBuilder()
		.setDescription("Please use slash command /grade instead.");
    message.reply({
      embeds: [embed],
	  ephemeral: true
    });
  }
};
