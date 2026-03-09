-- Add notification preferences to users
ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN notification_time TEXT DEFAULT '21:00';
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Asia/Tashkent';
ALTER TABLE users ADD COLUMN weekly_summary INTEGER DEFAULT 1;
