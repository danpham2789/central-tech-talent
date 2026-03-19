const { EmbedBuilder } = require("discord.js");
const { loadDB } = require("../../database");

function buildRedeemEmbed(result) {
  if (result.error === "not_found") {
    return new EmbedBuilder()
      .setColor(0xFF5C5C)
      .setTitle("❌ Invalid Code")
      .setDescription(`Code \`${result.code}\` not found.`);
  }

  if (result.error === "already_redeemed") {
    return new EmbedBuilder()
      .setColor(0xFFB443)
      .setTitle("⚠️ Already Redeemed")
      .setDescription(`Redeemed by **${result.by}**`);
  }

  if (result.error === "user_limit") {
    return new EmbedBuilder()
      .setColor(0xFF5C5C)
      .setTitle("🚫 Limit Reached")
      .setDescription(`You already used \`${result.existingCode}\``);
  }

  return new EmbedBuilder()
    .setColor(0x00E5A0)
    .setTitle("🎉 Code Redeemed!")
    .setDescription(`You earned **${result.pc.total_score} points**!`)
    .addFields(
      { name: "🏆 Total", value: `${result.dp.total_points}`, inline: true }
    );
}

function buildPointsEmbed(userId, username) {
  const db = loadDB();
  const dp = db.discord_points.find(d => d.discord_user_id === userId);

  if (!dp) {
    return new EmbedBuilder()
      .setColor(0x3DACFF)
      .setTitle("📊 Your Points")
      .setDescription("No points yet.");
  }

  return new EmbedBuilder()
    .setColor(0x6C63FF)
    .setTitle(`📊 ${username}'s Points`)
    .addFields(
      { name: "🏆 Total Points", value: `${dp.total_points}`, inline: true },
      { name: "🎫 Codes Used", value: `${dp.codes_redeemed}`, inline: true }
    );
}

function buildLeaderboardEmbed() {
  const db = loadDB();
  const lb = [...db.discord_points]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 10);

  if (!lb.length) {
    return new EmbedBuilder()
      .setColor(0xFFB443)
      .setTitle("🏆 Leaderboard")
      .setDescription("No data yet.");
  }

  const lines = lb.map(
    (u, i) => `\`${i + 1}.\` **${u.discord_username}** — ${u.total_points} pts`
  );

  return new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle("🏆 Leaderboard")
    .setDescription(lines.join("\n"));
}

module.exports = {
  buildRedeemEmbed,
  buildPointsEmbed,
  buildLeaderboardEmbed
};
