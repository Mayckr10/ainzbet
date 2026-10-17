import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cls, fmt, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { speedFactor, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";

export default function Keno() {
  return <KenoGame />;
}

/** turbo: Keno Turbo (sorteio das 10 bolas em ~2 segundos, mesma tabela). */
export function KenoGame({ turbo = false }: { turbo?: boolean }) {
  const game = turbo ? "keno-turbo" : "keno";
  const table: number[][] = useApp((s) => s.config?.keno ?? []);
  const [bet, setBet] = useBet(game);
  const [picks, setPicks] = useState<number[]>(() => JSON.parse(localStorage.getItem("cc_keno_picks") ?? "[]"));
  const [drawn, setDrawn] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ hits: number; payout: number; id: number } | null>(null);
  const row = table[picks.length] ?? [];
  const [auto, setAuto] = useState(false);
  const autoRef = useRef(false);
  autoRef.current = auto;
  useEffect(() => {
    if (!auto || busy) return;
    const t = setTimeout(() => autoRef.current && play(), 450);
    return () => clearTimeout(t);
  }, [auto, busy]);

  function toggle(n: number) {
    if (busy) return;
    setDrawn([]);
    setRes(null);
    haptic.tap();
    sfx.chip();
    setPicks((p) => {
      const next = p.includes(n) ? p.filter((x) => x !== n) : p.length >= 10 ? p : [...p, n];
      localStorage.setItem("cc_keno_picks", JSON.stringify(next));
      return next;
    });
  }
  function random() {
    const s = new Set<number>();
    const k = picks.length || 10;
    while (s.size < k) s.add(1 + Math.floor(Math.random() * 40));
    setPicks([...s]);
    setDrawn([]);
    setRes(null);
    localStorage.setItem("cc_keno_picks", JSON.stringify([...s]));
  }

  async function play() {
    if (busy || !picks.length) return;
    setBusy(true);
    setDrawn([]);
    setRes(null);
    haptic.impact("medium");
    const r = await playInstant<{ drawn: number[]; hits: number; multiplier: number }>(game, bet, { picks });
    if (!r) {
      setAuto(false);
      return setBusy(false);
    }
    for (const n of r.result.drawn) {
      setDrawn((d) => [...d, n]);
      if (picks.includes(n)) {
        sfx.gem();
        haptic.impact("light");
      } else sfx.ball();
      await sleep((turbo ? 55 : 170) * speedFactor());
    }
    setRes({ hits: r.result.hits, payout: r.payout, id: r.roundId });
    if (!r.payout) sfx.lose();
    await celebrate(r.payout, bet);
    setBusy(false);
  }

  return (
    <GameShell
      title={turbo ? "Keno Turbo" : "Keno"}
      game={game}
      bg={turbo ? "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.25), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(239,68,68,0.25), transparent 70%), linear-gradient(180deg,#140b05,#070402)" : undefined}
      info={<><p>Escolha de 1 a 10 números entre 40. São sorteados 10. O prêmio depende de quantos você acertar (tabela abaixo da grade). RTP ≈ 97%.</p>{turbo && <p>No Keno Turbo o sorteio inteiro acontece em cerca de 2 segundos, e o AUTO repete a jogada sem parar.</p>}</>}
    >
      <div className="flex-1 flex flex-col justify-center px-3 gap-3">
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
            const picked = picks.includes(n);
            const hit = drawn.includes(n);
            return (
              <motion.button
                key={n}
                onClick={() => toggle(n)}
                animate={hit ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                className={cls(
                  "aspect-square rounded-lg text-[13px] font-extrabold grid place-items-center border",
                  picked && hit ? "bg-win-500 text-space-950 border-win-300 shadow-[0_0_12px_rgba(74,222,128,0.7)]" : picked ? "bg-nebula-600 border-nebula-400 text-white" : hit ? "bg-white/15 border-white/30 text-white" : "bg-space-800/70 border-white/5 text-white/70",
                )}
              >
                {n}
              </motion.button>
            );
          })}
        </div>
        <div className="glass rounded-2xl p-2 overflow-x-auto no-scrollbar">
          {picks.length ? (
            <div className="flex gap-1 min-w-max">
              {row.map((m, h) => (
                <div key={h} className={cls("w-[52px] rounded-lg py-1 text-center", res?.hits === h ? (m > 0 ? "bg-win-500/30 ring-1 ring-win-400" : "bg-white/10") : "bg-white/5")}>
                  <div className="text-[10px] text-white/45 font-bold">{h} acertos</div>
                  <div className={cls("text-xs font-black", m > 0 ? "text-gold-300" : "text-white/30")}>{m > 0 ? `${m}x` : "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-white/50 py-2">Escolha seus números (até 10)</div>
          )}
        </div>
        <div className="h-8 text-center">
          {res && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cls("font-display font-black text-lg", res.payout > 0 ? "text-win-400" : "text-white/60")}>
              {res.hits} de {picks.length} · {res.payout > 0 ? `+${fmt(res.payout)}` : "sem prêmio"}
              {res.payout > 0 && !busy && <button onClick={() => shareRound(res.id)} className="ml-2 text-[10px] text-plasma-400 press align-middle">COMPARTILHAR ↗</button>}
            </motion.div>
          )}
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          {turbo ? (
            <Btn variant={auto ? "red" : "glass"} size="lg" className="w-20 text-xs" disabled={!picks.length} onClick={() => setAuto(!auto)}>{auto ? "PARAR" : "AUTO"}</Btn>
          ) : null}
          <Btn variant="glass" size="lg" className={turbo ? "w-14 text-base" : "w-24 text-xs"} disabled={busy} onClick={random}>{turbo ? "🎲" : "SURPRESA"}</Btn>
          <Btn variant="glass" size="lg" className={turbo ? "w-14 text-base" : "w-20 text-xs"} disabled={busy || !picks.length} onClick={() => { setPicks([]); setDrawn([]); setRes(null); }}>{turbo ? "✕" : "LIMPAR"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" disabled={busy || !picks.length} pulse={!busy && picks.length > 0} onClick={play}>SORTEAR</Btn>
        </div>
      </div>
    </GameShell>
  );
}
