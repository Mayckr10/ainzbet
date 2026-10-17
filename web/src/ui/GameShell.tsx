import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError, MESSAGES } from "../lib/api";
import { cls, fmt, fmtMult } from "../lib/format";
import { appStore, revealBalance, setBalance, showDebit, useApp } from "../lib/store";
import { onBackButton, inTelegram, shareMessage, haptic } from "../lib/tg";
import { BalancePill, Sheet, Spinner, toast } from "./kit";
import { nav } from "../nav";

export function GameShell({
  title,
  game,
  children,
  controls,
  info,
  className,
  headerExtra,
}: {
  title: string;
  game: string;
  children: ReactNode;
  controls?: ReactNode;
  info?: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showHist, setShowHist] = useState(false);
  useEffect(() => onBackButton(() => nav.back()), []);
  return (
    <div className={cls("fixed inset-0 flex flex-col overflow-hidden", className ?? "nebula-bg")}>
      <div className="stars-layer" />
      <header className="relative z-10 flex items-center gap-2 px-3 pb-2" style={{ paddingTop: "calc(var(--safe-top) + 10px)" }}>
        {!inTelegram && (
          <button onClick={() => nav.back()} className="press w-9 h-9 rounded-full glass grid place-items-center text-lg">‹</button>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[15px] truncate leading-tight">{title}</div>
          <div className="flex gap-3 mt-0.5">
            {info && (
              <button onClick={() => setShowInfo(true)} className="text-[11px] font-bold text-white/50 press">ⓘ Regras</button>
            )}
            <button onClick={() => setShowHist(true)} className="text-[11px] font-bold text-white/50 press">↺ Histórico</button>
            {headerExtra}
          </div>
        </div>
        <BalancePill onClick={() => nav.push({ name: "store" })} />
      </header>
      <main className="relative z-0 flex-1 min-h-0 flex flex-col">{children}</main>
      {controls && (
        <footer className="relative z-10 px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
          {controls}
        </footer>
      )}
      <Sheet open={showInfo} onClose={() => setShowInfo(false)} title="Regras e pagamentos">
        <div className="text-sm text-white/80 leading-relaxed space-y-3 pb-4">{info}</div>
      </Sheet>
      <HistorySheet open={showHist} onClose={() => setShowHist(false)} game={game} />
    </div>
  );
}

function HistorySheet({ open, onClose, game }: { open: boolean; onClose: () => void; game: string }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    if (!open) return;
    setRows(null);
    api.get(`/history?game=${game}`).then((r) => setRows(r.rounds)).catch(() => setRows([]));
  }, [open, game]);
  return (
    <Sheet open={open} onClose={onClose} title="Últimas rodadas">
      {!rows ? (
        <div className="py-10 grid place-items-center"><Spinner /></div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-white/50 text-sm">Nenhuma rodada ainda.</div>
      ) : (
        <div className="flex flex-col gap-1.5 pb-4">
          {rows.map((r) => {
            const base = Number(r.params?.bet ?? r.bet) || 0;
            const profit = r.payout - r.bet;
            return (
              <div key={r.id} className="glass rounded-xl px-3 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <div className="font-bold text-white/85">#{r.id}{r.params?.free ? " · giro grátis" : r.params?.bonus ? " · bônus" : ""}</div>
                  <div className="text-[11px] text-white/40">{new Date(r.created_at).toLocaleString("pt-BR")} · nonce {r.nonce}</div>
                </div>
                <div className="text-right">
                  <div className={cls("font-extrabold tabular", profit > 0 ? "text-win-400" : profit < 0 ? "text-white/60" : "text-white/80")}>
                    {profit > 0 ? "+" : ""}{fmt(profit)}
                  </div>
                  <div className="text-[11px] text-white/40">aposta {fmt(r.bet)}{base && r.payout ? ` · ${fmtMult(r.payout / base)}` : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------------- chamadas de jogo */

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return MESSAGES[e.code] ?? e.message;
  return "Falha de conexão";
}

/** Joga uma rodada instantânea: debita visualmente, chama a API e segura o saldo até o fim da animação. */
export async function playInstant<T = any>(game: string, bet: number, params: any, totalBet = bet) {
  const u = appStore.get().user;
  if (u && u.balance < totalBet) {
    toast("Saldo insuficiente", "error");
    offerRefill();
    return null;
  }
  showDebit(totalBet);
  try {
    const r = await api.post<{ roundId: number; bet: number; payout: number; result: T; balance: number }>(`/play/${game}`, { bet, params });
    setBalance(r.balance, false);
    return r;
  } catch (e) {
    revealBalance();
    toast(errorMessage(e), "error");
    return null;
  }
}

export async function startSession<T = any>(game: string, bet: number, params: any, totalBet = bet) {
  const u = appStore.get().user;
  if (u && u.balance < totalBet) {
    toast("Saldo insuficiente", "error");
    offerRefill();
    return null;
  }
  showDebit(totalBet);
  try {
    const r = await api.post<{ roundId: number; bet: number; done: boolean; payout: number; view: T; balance: number }>(`/session/${game}/start`, { bet, params });
    setBalance(r.balance, !r.done);
    return r;
  } catch (e) {
    revealBalance();
    toast(errorMessage(e), "error");
    return null;
  }
}

export async function sessionAction<T = any>(roundId: number, action: string, payload: any = {}, quiet = false) {
  try {
    const r = await api.post<{ roundId: number; bet: number; done: boolean; payout: number; view: T; balance: number }>(`/session/${roundId}/action`, { action, payload });
    setBalance(r.balance, !r.done);
    return r;
  } catch (e) {
    if (!quiet) toast(errorMessage(e), "error");
    return null;
  }
}

export async function shareRound(roundId: number) {
  haptic.impact("medium");
  try {
    const { id } = await api.post<{ id: string }>("/share", { roundId });
    const ok = await shareMessage(id);
    if (ok) toast("Resultado compartilhado! 🎉", "success");
  } catch (e) {
    toast(errorMessage(e), "error");
  }
}

let lastOffer = 0;
function offerRefill() {
  if (Date.now() - lastOffer < 20_000) return;
  lastOffer = Date.now();
  const u = appStore.get().user;
  if (u?.bonus.available || u?.bonus.rescueAvailable) nav.push({ name: "lobby", bonus: true } as any);
  else nav.push({ name: "store" });
}

export function useUser() {
  return useApp((s) => s.user);
}
