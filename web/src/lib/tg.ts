/* Wrapper fino sobre window.Telegram.WebApp, com fallback para navegador comum. */
type WebApp = any;

export const tg: WebApp | null =
  typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initData ? (window as any).Telegram.WebApp : null;

export const inTelegram = !!tg;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#07060f");
    tg.setBackgroundColor("#07060f");
    tg.setBottomBarColor?.("#07060f");
  } catch {}
  try {
    tg.disableVerticalSwipes?.();
  } catch {}
}

export function initData(): string {
  return tg?.initData ?? "";
}

export function startParam(): string | null {
  return tg?.initDataUnsafe?.start_param ?? null;
}

let hapticsOn = true;
export function setHaptics(on: boolean) {
  hapticsOn = on;
}

export const haptic = {
  tap() {
    if (hapticsOn) tg?.HapticFeedback?.selectionChanged();
  },
  impact(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") {
    if (hapticsOn) tg?.HapticFeedback?.impactOccurred(style);
  },
  success() {
    if (hapticsOn) tg?.HapticFeedback?.notificationOccurred("success");
  },
  error() {
    if (hapticsOn) tg?.HapticFeedback?.notificationOccurred("error");
  },
  warning() {
    if (hapticsOn) tg?.HapticFeedback?.notificationOccurred("warning");
  },
};

export function onBackButton(cb: (() => void) | null) {
  if (!tg?.BackButton) return () => {};
  if (!cb) {
    tg.BackButton.hide();
    return () => {};
  }
  tg.BackButton.show();
  tg.BackButton.onClick(cb);
  return () => tg.BackButton.offClick(cb);
}

export function openInvoice(link: string): Promise<"paid" | "cancelled" | "failed" | "pending"> {
  return new Promise((resolve) => {
    if (!tg?.openInvoice) {
      window.open(link, "_blank");
      resolve("pending");
      return;
    }
    tg.openInvoice(link, (status: any) => resolve(status));
  });
}

export function shareMessage(id: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tg?.shareMessage) return resolve(false);
    tg.shareMessage(id, (ok: boolean) => resolve(!!ok));
  });
}

export function confirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (tg?.showConfirm) tg.showConfirm(text, (ok: boolean) => resolve(ok));
    else resolve(window.confirm(text));
  });
}

export function requestFullscreen() {
  try {
    tg?.requestFullscreen?.();
  } catch {}
}
