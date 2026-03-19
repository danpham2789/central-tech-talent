# Trany Code Contest Platform ⚡

A Codeforces-style competitive programming platform built with Node.js, Express, and Vanilla JS, featuring real-time code execution and Discord bot integration.

## 🌟 Features

*   **No Account Required:** Users join contests with just an email, name, and phone number.
*   **Real-time Code Execution:** Code is compiled and tested against test cases using the free Piston API. Supports Python, JavaScript, C, C++, Java, Go, and Rust.
*   **Contest Workspace:** A dark-theme workspace with a code editor, problem descriptions (including PDF viewing), and test result displays.
*   **Score & Point Codes:** Users earn points for passing test cases. Upon completion, a unique "Point Code" is generated.
*   **Discord Bot Integration:** Users take their point code to the connected Discord server to redeem points. The bot tracks leaderboards and individual scores.
*   **Auto One-Time Discord Invites:** Automatically generates a one-time-use Discord invite link using the Discord API when a user completes a contest.
*   **Admin Dashboard:** A secured area to manage contests, add problems (with PDFs and JSON test cases), view point codes, and configure Discord bot settings.

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express
*   **Frontend:** Vanilla JS, HTML, CSS (Custom Dark Theme)
*   **Database:** Local JSON File Storage (`data/db.json`)
*   **Code Execution:** [Piston API](https://emkc.org/api/v2/piston)
*   **Bot:** Discord.js (v14)

## 🚀 Setup & Installation

### 1. Requirements
*   Node.js (v16 or higher recommended)
*   A Discord Bot Token & Application ID (from the [Discord Developer Portal](https://discord.com/developers/applications))

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables (Optional)
Create a `.env` file (or set these in your system):
```
PORT=3000
ADMIN_PASSWORD=admin123
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

### 4. Run the Web Server
```bash
npm start
```
The website will be available at `http://localhost:3000`.

### 5. Run the Discord Bot
```bash
node bot/index.js
```
*Note: Make sure to enable the **Message Content Intent** in your Discord Developer Portal -> Bot -> Privileged Gateway Intents.*

## ⚙️ Admin Configuration

1. Go to `http://localhost:3000` and click the **Admin** button (default password: `admin123`).
2. Navigate to the **⚙️ Settings** section.
3. Add your **Bot Token** and **Channel ID** to enable automatic one-time Discord invites when users complete a contest.
4. You can also create your first contest and add questions from this panel!

## 🤖 Discord Commands
*   `!redeem CODE` or `/redeem CODE`: Redeem a point code.
*   `!points` or `/points`: Check your total accumulated points.
*   `!leaderboard` or `/leaderboard`: View the top 15 scorers in the server.
