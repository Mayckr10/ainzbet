import { useSyncExternalStore } from "react";
import { api } from "./api";
import { setSound } from "./sound";
import { setHaptics } from "./tg";

/* Store global minimalista (sem dependências). */
function createStore<T extends object>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const p = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...p };
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

export type User = {
  id: number;
  name: string;
  username: string | null;
  photo: string | null;
  balance: number;
  stats: { wagered: number; won: number; rounds: number; biggestWin: number };
  bonus: { daily: number; availableAt: number; available: boolean; rescue: number; rescueAvailable: boolean; rescueAt: number };
  fair: { serverSeedHash: string; clientSeed: string; nonce: number };
  vip: { until: number } | null;
  supporter: { stars: number; tier: string | null };
  store: { firstPurchase: boolean; dealClaimedToday: boolean };
  limits: { minBet: number; maxBet: number };
};

export type Settings = {
  sound: boolean;
  haptics: boolean;
  speed: "normal" | "fast" | "turbo";
  quality: "high" | "low";
};

const SETTINGS_KEY = "cc_settings_v1";

function loadSettings(): Settings {
  const def: Settings = { sound: true, haptics: true, speed: "normal", quality: "high" };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return def;
  }
}

export const appStore = createStore({
  user: null as User | null,
  config: null as any,
  context: { inGroup: false, chatType: null as string | null, startParam: null as string | null },
  settings: loadSettings(),
  /** saldo mostrado (pode ficar "atrasado" enquanto uma animação revela o prêmio) */
  displayBalance: 0,
  holdBalance: false,
  error: null as string | null,
});

export function useApp<T>(sel: (s: ReturnType<typeof appStore.get>) => T): T {
  return useSyncExternalStore(appStore.subscribe, () => sel(appStore.get()));
}

export function applySettings(s: Settings) {
  setSound(s.sound);
  setHaptics(s.haptics);
  document.documentElement.classList.toggle("lowfx", s.quality === "low");
}

export function updateSettings(p: Partial<Settings>) {
  const s = { ...appStore.get().settings, ...p };
  appStore.set({ settings: s });
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
  applySettings(s);
}

/** Fator de velocidade das animações conforme configuração. */
export function speedFactor() {
  const sp = appStore.get().settings.speed;
  return sp === "turbo" ? 0.35 : sp === "fast" ? 0.6 : 1;
}

export async function refreshUser() {
  const r = await api.get<{ user: User; context: any }>("/me");
  appStore.set((s) => ({ user: r.user, context: r.context, displayBalance: s.holdBalance ? s.displayBalance : r.user.balance }));
  return r.user;
}

/**
 * Atualiza o saldo real. Se `reveal` for falso, o saldo exibido fica segurado
 * até chamar revealBalance() (para o prêmio "cair" no saldo no fim da animação).
 */
export function setBalance(balance: number, reveal = true) {
  appStore.set((s) => ({
    user: s.user ? { ...s.user, balance } : s.user,
    displayBalance: reveal ? balance : s.displayBalance,
    holdBalance: !reveal,
  }));
}

/** Debita visualmente a aposta antes do resultado chegar. */
export function showDebit(amount: number) {
  appStore.set((s) => ({ displayBalance: Math.max(0, s.displayBalance - amount), holdBalance: true }));
}

export function revealBalance() {
  appStore.set((s) => ({ displayBalance: s.user?.balance ?? s.displayBalance, holdBalance: false }));
}

export function setUser(user: User) {
  appStore.set((s) => ({ user, displayBalance: s.holdBalance ? s.displayBalance : user.balance }));
}
