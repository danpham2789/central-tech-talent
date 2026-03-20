const { TECH, TECH_PLUS, TECH_PREMIUM, TECH_CHANNEL, TECH_PLUS_CHANNEL, TECH_PREMIUM_CHANNEL } = require("../config.js");
const { loadDB, saveDB } = require("../../database.js");
const { EmbedBuilder } = require("discord.js");

function modifyRank(interaction, userID) {
	const member = interaction.guild.members.cache.get(userID);
	if (!member) return;
	const targetRoles = [TECH, TECH_PLUS, TECH_PREMIUM];
	const role = targetRoles.find(roleID => member.roles.cache.has(roleID));

	const db = loadDB();
	const user = db.discord_points.find(d => d.discord_user_id === userID);
	if (!user) return;

	member.roles.remove(TECH);
	member.roles.remove(TECH_PLUS);
	member.roles.remove(TECH_PREMIUM);

	if (user.total_points <= 1000) {
		member.roles.add(TECH);
	} else if (user.total_points <= 5000) {
		member.roles.add(TECH_PLUS);
		if (role !== TECH_PLUS) {
			const channel = interaction.guild.channels.cache.get(TECH_PLUS_CHANNEL);
			if (channel) {
				const embed = new EmbedBuilder()
					.setTitle(`🌟 Congratulation!`)
					.setDescription(`${member.displayName} have achieved TECH-PLUS. Great job!`)
					.setColor(0xF7C85C)
				channel.send({
					embeds: [embed],
				})
			}
		}
	} else {
		member.roles.add(TECH_PREMIUM);
		if (role !== TECH_PREMIUM) {
			const channel = interaction.guild.channels.cache.get(TECH_PREMIUM_CHANNEL);
			if (channel) {
				const embed = new EmbedBuilder()
					.setTitle(`🌟 Congratulation!`)
					.setDescription(`${member.displayName} have achieved a TECH-PREMIUM. Great job!`)
					.setColor(0xF7C85C)
				channel.send({
					embeds: [embed],
				})
			}
		}
	}
}

module.exports = { modifyRank };
