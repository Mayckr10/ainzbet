import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink } from "./common";

const PAYS = [
  { lines: 1, label: "1 linha", m: 4.8 },
  { lines: 2, label: "2 linhas", m: 40 },
  { lines: 3, label: "Cartela cheia", m: 2000 },
];
type Res = { ticket: number[][]; draws: number[]; rowDone: number[]; lines: number; multiplier: number };

export default function Bingo90() {
  const [bet, setBet] = useBet("bingo90");
  const [ticket, setTicket] = useState<number[][] | null>(null);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ lines: number; payout: number; id: number } | null>(null);
  const skip = useRef(false);

  async function play() {
    if (busy) return;
    setBusy(true);
    skip.current = false;
    setRes(null);
    setDrawn([]);
    haptic.impact("medium");
    const r = await playInstant<Res>("bingo90", bet, {});
    if (!r) return setBusy(false);
    setTicket(r.result.ticket);
    const nums = new Set(r.result.ticket.flat().filter(Boolean));
    await sleep(500 * speedFactor());
    for (const n of r.result.draws) {
      setDrawn((d) => [...d, n]);
      if (!skip.current) {
        nums.has(n) ? sfx.gem() : sfx.ball();
        await sleep(110 * speedFactor());
      }
    }
    setRes({ lines: r.result.lines, payout: r.payout, id: r.roundId });
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const set = new Set(drawn);
  const rowsDone = ticket ? ticket.map((row) => row.filter(Boolean).every((n) => set.has(n))) : [];
  const last = drawn[drawn.length - 1];

  return (
    <GameShell
      title="Bingo 90 Bolas"
      game="bingo90"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(244,63,94,0.3), transparent 70%), linear-gradient(180deg,#1a0610,#090207)"
      info={<><p>Bingo britânico: cartela de 3 linhas × 9 colunas com 15 números (5 por linha) de 1 a 90. São sorteadas 50 bolas.</p><p>1 linha completa 4,8x · 2 linhas 40x · cartela cheia 2.000x. RTP ≈ 96%.</p></>}
    >
      <div className="flex items-center justify-between px-4 pt-1">
        <div className="text-[11px] font-black text-white/50">BOLAS {drawn.length}/50</div>
        <motion.div key={last} initial={{ scale: 0.3, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="w-14 h-14 rounded-full grid place-items-center font-display font-black text-xl text-[#3b0d1e] shadow-[0_0_20px_rgba(251,113,133,0.6)]" style={{ background: "radial-gradient(circle at 35% 30%,#fff,#fda4af 60%,#e11d48)" }}>
          {last ?? "–"}
        </motion.div>
        <div className="text-[11px] font-black text-white/50 text-right">LINHAS {rowsDone.filter(Boolean).length}</div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col justify-center px-3 gap-3">
        <div className="rounded-2xl p-2 bg-gradient-to-b from-rose-100 to-rose-200 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {(ticket ?? [[], [], []]).map((row, r) => (
            <div key={r} className={cls("grid grid-cols-9 gap-1 p-1 rounded-xl", rowsDone[r] && "bg-gold-400/60")}>
              {Array.from({ length: 9 }).map((_, c) => {
                const n = row[c];
                const hit = n && set.has(n);
                return (
                  <div key={c} className={cls("aspect-[0.85] rounded-md grid place-items-center text-[13px] font-black relative", n ? "bg-white text-rose-900 border border-rose-300" : "bg-rose-300/50")}>
                    {n || ""}
                    {hit && <motion.span initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 0.85 }} className="absolute inset-0.5 rounded-full bg-rose-600/80 grid place-items-center text-white">{n}</motion.span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-10 gap-[3px]">
          {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
            <div key={n} className={cls("aspect-square rounded-[4px] text-[8.5px] font-black grid place-items-center", set.has(n) ? "bg-rose-500 text-white" : "bg-white/5 text-white/30")}>{n}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {PAYS.map((p) => (
            <div key={p.lines} className={cls("rounded-xl py-1.5 text-center", res?.lines === p.lines ? "bg-gold-400/30 ring-1 ring-gold-300" : "bg-white/5")}>
              <div className="text-[10px] font-bold text-white/55">{p.label}</div>
              <div className="text-sm font-black text-gold-300">{fmtMult(p.m)}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer>
        {res && <div className={cls("text-center font-display font-black text-lg", res.payout ? "text-win-400" : "text-white/60")}>{res.payout ? `${PAYS[res.lines - 1].label}! +${fmt(res.payout)}` : "Nenhuma linha completa"}</div>}
        <BetInput value={bet} onChange={setBet} disabled={busy} label="Preço da cartela" />
        {busy ? <Btn variant="glass" size="lg" onClick={() => (skip.current = true)}>ACELERAR ⏩</Btn> : <Btn variant="gold" size="lg" pulse onClick={play}>COMPRAR CARTELA · {fmt(bet)}</Btn>}
        <ShareLink id={res && res.payout > 0 && !busy ? res.id : null} />
      </Footer>
    </GameShell>
  );
}
