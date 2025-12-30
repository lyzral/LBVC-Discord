# 🏆 LBVC — Discord Leaderboard Bot

LBVC is a **Discord leaderboard bot** that allows staff to display and manage a **clean leaderboard embed** inside a specific channel.

The bot is designed to run **automatically**, with restricted access for **SYS / Owners only**, and uses **persistent data storage**.

---

## ✨ Features

- 🏆 Leaderboard system with embed display
- 🧩 Fully customizable embed (title & color)
- 📊 Automatic leaderboard updates
- 📂 Target channel configuration
- 👑 SYS / Owners permission system
- 💾 Persistent storage using JSON
- ⚡ Lightweight and stable setup
- 🔒 Restricted access (owners only)

---

## 🧱 Project Structure

```txt
LBVC/
├── index.js
├── client.js
├── config2.js
├── package.json
├── package-lock.json
└── owners.json
```

---

## ⚙️ Requirements

- Node.js v18 or higher
- discord.js v14
- A Discord application (bot)

Administrator permission is recommended.

---

## 📦 Installation

```bash
cd LBVC
npm install
```

---

## 🔑 Configuration

Edit the `config2.js` file before starting the bot:

```js
module.exports = {
  client: {
    token: "SELF_CLIENT_TOKEN"
  },

  bot: {
    token: "BOT_TOKEN"
  },

  embed: {
    title: "Leaderboard",
    color: "#4f545c"
  },

  channelid: "CHANNEL_ID",

  owners: ["YOUR_DISCORD_ID"]
};
```

⚠️ **Never share your tokens.**

---

## ▶️ Running the Bot

```bash
node index.js
```

Production usage (recommended):

```bash
pm2 start index.js --name LBVC
```

---

## 🔒 Permissions & Access

- Only **owners** can manage or modify the bot
- Owners are defined in:
  - `config2.js`
  - `owners.json`

The bot will ignore all unauthorized users.

---

## ⚠️ Important Notes

- The `channelid` must be a valid text channel
- Embed appearance is fully customizable
- Data is stored persistently
- One instance per server is recommended
- Designed for private / controlled usage

---

## 📜 License

Private / educational use only.  
Redistribution or resale without permission is prohibited.

---

⭐ If you use this project, consider starring the repository.
