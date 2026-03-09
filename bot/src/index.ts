import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is required");

const webappUrl = process.env.WEBAPP_URL;
if (!webappUrl) throw new Error("WEBAPP_URL is required");

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "📱 Ilovani ochish",
    webappUrl
  );
  await ctx.reply(
    "Assalomu alaykum! TASHLA — yomon odatlarni tashlash ilovasi.\n\nBoshlash uchun pastdagi tugmani bosing:",
    { reply_markup: keyboard }
  );
});

bot.api.setChatMenuButton({
  menu_button: {
    type: "web_app",
    text: "TASHLA",
    web_app: { url: webappUrl },
  },
});

// Graceful shutdown — stop polling before Railway kills the process
const stopBot = () => {
  console.log("🛑 Stopping bot...");
  bot.stop();
};
process.once("SIGTERM", stopBot);
process.once("SIGINT", stopBot);

async function start() {
  const MAX_RETRIES = 10;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Clear any hanging getUpdates from a previous instance
      await bot.api.deleteWebhook({ drop_pending_updates: true });

      // Wait for old polling session to expire (longer on retries)
      const waitSec = Math.min(10 * attempt, 60);
      console.log(`⏳ Attempt ${attempt}/${MAX_RETRIES}: waiting ${waitSec}s for previous session to expire...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));

      await bot.start({
        drop_pending_updates: true,
        onStart: () => console.log("🤖 TASHLA bot is running"),
      });
      return; // started successfully
    } catch (err: unknown) {
      const is409 = err instanceof Error && err.message.includes("409");
      if (is409 && attempt < MAX_RETRIES) {
        console.log(`⚠️ Conflict (409), retrying...`);
        continue;
      }
      throw err;
    }
  }
}

start();
