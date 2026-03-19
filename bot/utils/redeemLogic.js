const { loadDB, saveDB } = require("../../database");

function redeemCode(code, userId, username) {
  const db = loadDB();
  const pc = db.point_codes.find(c => c.code === code);

  if (!pc) return { error: "not_found", code };
  if (pc.redeemed) {
    return { error: "already_redeemed", by: pc.discord_username || "someone" };
  }

  const alreadyUsed = db.point_codes.find(
    c => c.redeemed && c.discord_user_id === userId
  );
  if (alreadyUsed) {
    return { error: "user_limit", existingCode: alreadyUsed.code };
  }

  pc.redeemed = true;
  pc.discord_user_id = userId;
  pc.discord_username = username;
  pc.redeemed_at = new Date().toISOString();

  let dp = db.discord_points.find(d => d.discord_user_id === userId);

  if (dp) {
    dp.total_points += pc.total_score;
    dp.codes_redeemed += 1;
    dp.discord_username = username;
    dp.last_redeemed_at = new Date().toISOString();
  } else {
    dp = {
      discord_user_id: userId,
      discord_username: username,
      total_points: pc.total_score,
      codes_redeemed: 1,
      last_redeemed_at: new Date().toISOString()
    };
    db.discord_points.push(dp);
  }

  saveDB(db);
  return { success: true, pc, dp };
}

module.exports = { redeemCode };
