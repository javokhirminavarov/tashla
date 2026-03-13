interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      username?: string;
      language_code?: string;
    };
  };
  version: string;
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
    _dbg?: (msg: string) => void;
  }
}

const isTelegram = typeof window !== "undefined" && !!window.Telegram?.WebApp;

const mockWebApp: TelegramWebApp = {
  ready: () => {},
  expand: () => {},
  close: () => {},
  initData: "",
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: "Dev",
      username: "dev_user",
      language_code: "uz",
    },
  },
  version: "6.0",
  isVersionAtLeast: () => true,
  setHeaderColor: () => {},
  setBackgroundColor: () => {},
  HapticFeedback: {
    impactOccurred: () => {},
    notificationOccurred: () => {},
  },
  showConfirm: (_msg: string, cb: (confirmed: boolean) => void) => cb(true),
  MainButton: {
    text: "",
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {},
  },
  BackButton: {
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {},
  },
};

export const tg: TelegramWebApp = isTelegram
  ? window.Telegram!.WebApp
  : mockWebApp;

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  tg.HapticFeedback.impactOccurred(style);
}
