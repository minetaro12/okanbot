import { ActivityType, Client, GatewayIntentBits } from "discord.js";
import parser from "yargs-parser";
import { sleepHandler } from "./handlers/sleep.ts";
import { statusHandler } from "./handlers/status.ts";

// .env読み込み
process.loadEnvFile("./.env");

export const client = new Client({
  intents: [
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.on("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  const updateStatus = () => {
    client.user?.setActivity({
      name: `!sleepでVC切断時間を設定`,
      type: ActivityType.Custom
    });
  };

  updateStatus();

  // 30秒ごとにステータスを更新
  setInterval(updateStatus, 30000);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const args = parser(message.content);

  switch (args._[0]?.toString().split("!")[1]) {
    case "sleep": {
      sleepHandler(message);
      break;
    }
    case "status": {
      statusHandler(message);
      break;
    }
    default: {
      break;
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
