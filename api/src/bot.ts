import { createHash } from "crypto";
import { Bot, InlineKeyboard, webhookCallback } from "grammy";

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const WEBAPP_URL = process.env.WEBAPP_URL || "";
const DEV_MODE = process.env.DEV_MODE === "true";

let botInstance: Bot | null = null;

export function getBot(): Bot | null {
  if (!BOT_TOKEN || BOT_TOKEN === "your_bot_token_from_botfather") return null;
  if (!botInstance) {
    botInstance = new Bot(BOT_TOKEN);
  }
  return botInstance;
}

/** Webhook path secret derived from BOT_TOKEN */
export function getWebhookPath(): string {
  const hash = createHash("sha256").update(BOT_TOKEN).digest("hex").slice(0, 16);
  return `/bot-webhook/${hash}`;
}

/** Register bot commands and menu button */
function setupBotHandlers(bot: Bot): void {
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
}

/** Returns Express middleware for the webhook route */
export function getBotWebhookCallback() {
  const bot = getBot();
  if (!bot) return null;
  return webhookCallback(bot, "express");
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

  setupBotHandlers(bot);

  if (DEV_MODE) {
    // Local dev: use long polling
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      await bot.start({
        drop_pending_updates: true,
        onStart: () => console.log("🤖 TASHLA bot is running (polling)"),
      });
    } catch (err: unknown) {
      const is409 = err instanceof Error && err.message.includes("409");
      if (is409) {
        console.log("⚠️ Conflict (409) — another polling session active. Retrying in 5s...");
        await new Promise((r) => setTimeout(r, 5000));
        await bot.api.deleteWebhook({ drop_pending_updates: true });
        await bot.start({
          drop_pending_updates: true,
          onStart: () => console.log("🤖 TASHLA bot is running (polling, retry)"),
        });
      } else {
        throw err;
      }
    }
  } else {
    // Production: use webhooks — no polling, no 409 conflicts
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    if (!domain) {
      console.log("⚠️ RAILWAY_PUBLIC_DOMAIN not set — cannot configure webhook, bot disabled");
      return;
    }

    const webhookUrl = `https://${domain}${getWebhookPath()}`;
    await bot.api.setWebhook(webhookUrl, { drop_pending_updates: true });
    console.log(`🤖 TASHLA bot webhook set to ${webhookUrl}`);
  }
}

export function stopBot(): void {
  if (botInstance && DEV_MODE) {
    console.log("🛑 Stopping bot polling...");
    botInstance.stop();
  }
}
