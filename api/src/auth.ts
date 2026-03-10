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

const BOT_TOKEN = (process.env.BOT_TOKEN || "").trim();

function validateInitData(initData: string): TelegramUser | null {
  console.log(`[auth] validateInitData called, initData length=${initData.length}`);

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    console.log("[auth] FAIL: no hash param found in initData");
    return null;
  }
  console.log(`[auth] hash param found, length=${hash.length}`);

  params.delete("hash");
  const entries = Array.from(params.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  console.log(`[auth] dataCheckString keys: ${entries.map(([k]) => k).join(", ")}`);
  console.log(`[auth] BOT_TOKEN length=${BOT_TOKEN.length}, first4=${BOT_TOKEN.slice(0, 4)}, last4=${BOT_TOKEN.slice(-4)}`);

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    console.log(`[auth] FAIL: hash mismatch. computed=${computedHash.slice(0, 8)}... received=${hash.slice(0, 8)}...`);
    return null;
  }
  console.log("[auth] hash validation PASSED");

  const userStr = params.get("user");
  if (!userStr) {
    console.log("[auth] FAIL: no user param in initData");
    return null;
  }

  try {
    const user = JSON.parse(userStr) as TelegramUser;
    console.log(`[auth] user parsed: id=${user.id}, name=${user.first_name}`);
    return user;
  } catch {
    console.log("[auth] FAIL: could not parse user JSON");
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
  console.log(`[auth] middleware: initData header ${initData ? `present (length=${initData.length})` : "MISSING"}`);
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
