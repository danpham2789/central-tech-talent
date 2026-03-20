const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

module.exports = {
  TOKEN: process.env.DISCORD_BOT_TOKEN,
  CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  PREFIX: "!",
  WELCOMEID: process.env.WELCOMEID,
  GUILD_ID: process.env.GUILD_ID,
  TECH: process.env.TECH_ROLE,
  TECH_PLUS: process.env.TECH_PLUS_ROLE,
  TECH_PREMIUM: process.env.TECH_PREMIUM_ROLE,
  TECH_CHANNEL: process.env.TECH_CHANNEL,
  TECH_PLUS_CHANNEL: process.env.TECH_PLUS_CHANNEL,
  TECH_PREMIUM_CHANNEL: process.env.TECH_PREMIUM_CHANNEL,
  MINICASE_ID: process.env.MINICASE_ID,
  HACKATHON_ID: process.env.HACKATHON_ID
};
