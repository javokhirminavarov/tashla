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

async function startWithRetry() {
  // Clear any hanging getUpdates from a previous instance
  await bot.api.deleteWebhook({ drop_pending_updates: true });

  try {
    await bot.start({
      drop_pending_updates: true,
      onStart: () => console.log("🤖 TASHLA bot is running"),
    });
  } catch (err: unknown) {
    const isConflict =
      err instanceof Error && err.message.includes("409");
    if (isConflict) {
      console.log("⏳ Conflict detected, retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
      await startWithRetry();
    } else {
      throw err;
    }
  }
}

startWithRetry();
