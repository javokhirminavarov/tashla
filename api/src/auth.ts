import { Request, Response, NextFunction } from "express";
import { createHmac } from "crypto";
import { query } from "./db.js";

interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: { id: number; telegram_id: number; first_name: string; username: string; language: string };
    }
  }
}

const BOT_TOKEN = process.env.BOT_TOKEN || "";

function validateInitData(initData: string): TelegramUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const entries = Array.from(params.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) return null;

  const userStr = params.get("user");
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}

async function upsertUser(tgUser: TelegramUser): Promise<{ id: number; telegram_id: number; first_name: string; username: string; language: string }> {
  const result = await query(
    `INSERT INTO users (telegram_id, first_name, username)
     VALUES ($1, $2, $3)
     ON CONFLICT (telegram_id) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       username = EXCLUDED.username
     RETURNING id, telegram_id, first_name, username, language`,
    [tgUser.id, tgUser.first_name || "", tgUser.username || ""]
  );
  const row = result.rows[0] as { id: number; telegram_id: number; first_name: string; username: string; language: string };
  return row;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (process.env.DEV_MODE === "true") {
    const devTelegramId = parseInt(process.env.DEV_TELEGRAM_ID || "123456789", 10);
    const user = await upsertUser({ id: devTelegramId, first_name: "Dev", username: "dev_user" });
    req.user = user;
    return next();
  }

  const initData = req.headers["x-telegram-init-data"] as string | undefined;
  if (!initData) {
    res.status(401).json({ error: "Missing X-Telegram-Init-Data header" });
    return;
  }

  const tgUser = validateInitData(initData);
  if (!tgUser) {
    res.status(401).json({ error: "Invalid initData" });
    return;
  }

  const user = await upsertUser(tgUser);
  req.user = user;
  next();
}

export { upsertUser, validateInitData };
