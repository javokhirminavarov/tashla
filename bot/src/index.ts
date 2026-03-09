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

bot.start();
console.log("🤖 TASHLA bot is running");
