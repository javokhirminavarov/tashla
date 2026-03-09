import { Bot, InlineKeyboard } from "grammy";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const WEBAPP_URL = process.env.WEBAPP_URL || "";

let botInstance: Bot | null = null;

export function getBot(): Bot | null {
  if (!BOT_TOKEN || BOT_TOKEN === "your_bot_token_from_botfather") return null;
  if (!botInstance) {
    botInstance = new Bot(BOT_TOKEN);
  }
  return botInstance;
}

export async function startBot(): Promise<void> {
  const bot = getBot();
  if (!bot) {
    console.log("⚠️ BOT_TOKEN not configured — bot disabled");
    return;
  }

  if (!WEBAPP_URL) {
    console.log("⚠️ WEBAPP_URL not configured — bot disabled");
    return;
  }

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp(
      "📱 Ilovani ochish",
      WEBAPP_URL
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
      web_app: { url: WEBAPP_URL },
    },
  });

  const MAX_RETRIES = 10;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: true });

      const waitSec = Math.min(10 * attempt, 60);
      console.log(`⏳ Attempt ${attempt}/${MAX_RETRIES}: waiting ${waitSec}s for previous session to expire...`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));

      await bot.start({
        drop_pending_updates: true,
        onStart: () => console.log("🤖 TASHLA bot is running"),
      });
      return;
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

export function stopBot(): void {
  if (botInstance) {
    console.log("🛑 Stopping bot...");
    botInstance.stop();
  }
}
