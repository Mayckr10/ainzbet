import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtCompact, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { appStore, speedFactor } from "../lib/store";
import { haptic } from "../lib/tg";
import { PlayingCard, Shoe } from "../ui/cards";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { Btn, ChipIcon, toast } from "../ui/kit";
import { Felt } from "./Blackjack";

const CHIPS = [10, 50, 100, 500, 1000, 5000];
const AREAS = [
  { key: "playerPair", label: "PAR JOGADOR", pay: "11:1", cls: "bg-sky-900/50" },
  { key: "tie", label: "EMPATE", pay: "8:1", cls: "bg-emerald-800/60" },
  { key: "bankerPair", label: "PAR BANCA", pay: "11:1", cls: "bg-rose-900/50" },
  { key: "player", label: "JOGADOR", pay: "1:1", cls: "bg-sky-700/50" },
  { key: "banker", label: "BANCA", pay: "0,95:1", cls: "bg-rose-700/50" },
] as const;

export default function Baccarat() {
  const [chip, setChip] = useState(100);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<{ P: number[]; B: number[] }>({ P: [], B: [] });
  const [totals, setTotals] = useState<{ P: number | null; B: number | null }>({ P: null, B: null });
  const [winner, setWinner] = useState<string | null>(null);
  const [wins, setWins] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [road, setRoad] = useState<string[]>([]);
  const [last, setLast] = useState<{ id: number; payout: number } | null>(null);
  const total = Object.values(bets).reduce((a, b) => a + b, 0);

  function place(k: string) {
    if (busy) return;
    if (total + chip > (appStore.get().user?.balance ?? 0)) return toast("Saldo insuficiente", "error");
    haptic.tap();
    sfx.chip();
    setWinner(null);
    setWins([]);
    setBets((b) => ({ ...b, [k]: (b[k] ?? 0) + chip }));
  }

  async function deal() {
    if (busy || !total) return;
    setBusy(true);
    setCards({ P: [], B: [] });
    setTotals({ P: null, B: null });
    setWinner(null);
    setWins([]);
    const r = await playInstant<{ player: number[]; banker: number[]; order: ("P" | "B")[]; playerTotal: number; bankerTotal: number; winner: string; wins: string[] }>("baccarat", 1, { bets }, total);
    if (!r) return setBusy(false);
    const res = r.result;
    const idx = { P: 0, B: 0 };
    const val = (c: number) => { const k = c % 13; return k <= 7 ? k + 2 : k === 12 ? 1 : 0; };
    for (const side of res.order) {
      const c = side === "P" ? res.player[idx.P++] : res.banker[idx.B++];
      setCards((s) => ({ ...s, [side]: [...s[side], c] }));
      await sleep(650 * speedFactor());
      const hand = side === "P" ? res.player.slice(0, idx.P) : res.banker.slice(0, idx.B);
      setTotals((t) => ({ ...t, [side]: hand.reduce((a, x) => a + val(x), 0) % 10 }));
    }
    await sleep(300);
    setWinner(res.winner);
    setWins(res.wins);
    setRoad((r0) => [res.winner, ...r0].slice(0, 24));
    haptic.impact("heavy");
    setLast({ id: r.roundId, payout: r.payout });
    if (r.payout > total) await celebrate(r.payout, total);
    else {
      if (!r.payout) sfx.lose();
      await celebrate(0, total);
    }
    setBets({});
    setBusy(false);
  }

  const handBox = (side: "P" | "B", title: string, color: string) => (
    <div className={cls("flex-1 flex flex-col items-center rounded-2xl py-2", winner === (side === "P" ? "player" : "banker") && "bg-gold-400/15 ring-2 ring-gold-400")}>
      <div className="text-xs font-black tracking-widest" style={{ color }}>{title}</div>
      <div className="flex -space-x-6 min-h-[92px] mt-1">
        {cards[side].map((c, i) => (
          <div key={i} className={i === 2 ? "rotate-90 translate-y-3" : ""}><PlayingCard card={c} index={0} /></div>
        ))}
      </div>
      <div className="mt-1 h-7 w-9 rounded-full bg-black/50 grid place-items-center font-display font-black">{totals[side] ?? "–"}</div>
    </div>
  );

  return (
    <GameShell title="Bacará" game="baccarat" info={<><p>Aposte em quem fecha mais perto de 9: Jogador (1:1), Banca (0,95:1) ou Empate (8:1). No empate, apostas em Jogador e Banca são devolvidas. Pares pagam 11:1.</p><p>Regras clássicas de terceira carta, 8 baralhos. RTP: Banca 98,9% · Jogador 98,8%.</p></>}>
      <Felt color="purple">
        <Shoe />
        <div className="absolute top-12 left-3 right-3 flex gap-2">
          {handBox("P", "JOGADOR", "#7dd3fc")}
          {handBox("B", "BANCA", "#fda4af")}
        </div>
        {winner && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute left-0 right-0 top-[188px] text-center font-display font-black text-xl gold-text">
            {winner === "tie" ? "EMPATE" : winner === "player" ? "JOGADOR VENCE" : "BANCA VENCE"}
            {last && last.payout > 0 && <span className="block text-sm text-win-400">+{fmt(last.payout)}</span>}
          </motion.div>
        )}
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-1.5">
          {AREAS.map((a) => (
            <button key={a.key} onClick={() => place(a.key)} className={cls("press relative rounded-xl border border-white/15 py-2 text-center", a.cls, (a.key === "player" || a.key === "banker") && "col-span-1 h-16", a.key === "player" && "col-start-1", wins.includes(a.key) && "ring-2 ring-gold-300")}>
              <div className="text-[10px] font-black">{a.label}</div>
              <div className="text-[9px] text-white/60 font-bold">{a.pay}</div>
              {bets[a.key] ? <div className="absolute -top-2 -right-1 rounded-full bg-gold-400 text-[#3b2300] text-[9px] font-black px-1.5 py-0.5">{fmtCompact(bets[a.key])}</div> : null}
            </button>
          ))}
          <div className="flex flex-wrap gap-0.5 items-center justify-center content-center">
            {road.slice(0, 12).map((w, i) => <span key={i} className={cls("w-3.5 h-3.5 rounded-full", w === "player" ? "bg-sky-400" : w === "banker" ? "bg-rose-400" : "bg-emerald-400")} />)}
          </div>
        </div>
      </Felt>
      <div className="px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="flex gap-1.5 justify-between">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => { setChip(c); haptic.tap(); }} className={cls("press flex-1 h-10 rounded-full text-[10px] font-black border-2 border-dashed border-white/50", chip === c ? "bg-gold-400 text-[#3b2300] -translate-y-1" : "bg-white/10")}>{fmtCompact(c)}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-24 text-xs" disabled={busy || !total} onClick={() => setBets({})}>LIMPAR</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || !total} pulse={!!total && !busy} onClick={deal}><ChipIcon size={18} /> DISTRIBUIR · {fmt(total)}</Btn>
        </div>
        {last && last.payout > 0 && !busy && <button onClick={() => shareRound(last.id)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
      </div>
    </GameShell>
  );
}
