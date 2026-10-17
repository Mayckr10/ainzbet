import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SymbolArt } from "../../art/Symbol";
import { FARAO } from "../../art/themes/themesA";
import { ANKH_GOLD } from "../../art/themes/themesH";
import { api } from "../../lib/api";
import { cls, fmt, fmtCompact, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance, speedFactor, useApp } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../../ui/effects";
import { GameShell, playInstant, shareRound } from "../../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../../ui/Reels";

type Cell = [number, number];
type Prog = { level: number; count: number };
type Result = { grid: number[][]; wins: { line: number; cells: Cell[] }[]; lineWin: number; ankhs: Cell[]; prev: Prog; cur: Prog; levelUps: { level: number; prize: number }[]; multiplier: number };
const ART: Record<number, React.ReactNode> = { ...FARAO, 10: ANKH_GOLD };
const BG = "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(30,64,175,0.4), transparent 70%), linear-gradient(180deg,#1a1304,#080602)";

export default function Pyramid() {
  const id = "as-piramide";
  const cfg = useApp((s) => s.config?.adv?.pyramid);
  const lines = useApp((s) => s.config?.adv?.lines ?? []);
  const prizes: number[] = cfg?.prizes ?? [3, 6, 12, 25, 100];
  const per: number = cfg?.perLevel ?? 10;
  const reels = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet(id, 100);
  const [state, setState] = useState<Record<string, Prog>>({});
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [hl, setHl] = useState<Set<string> | null>(null);
  const [act, setAct] = useState<number[]>([]);
  const [win, setWin] = useState(0);
  const [levelUp, setLevelUp] = useState<{ level: number; prize: number } | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const busyRef = useRef(false);
  const initial = useRef(Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => 2 + Math.floor(Math.random() * 8))));
  const prog = state[String(bet)] ?? { level: 0, count: 0 };

  useEffect(() => {
    api.get(`/game-state/${id}`).then((r) => r.state && setState(r.state)).catch(() => {});
  }, []);

  async function play() {
    if (busyRef.current) {
      reels.current?.hurry();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      setWin(0);
      setHl(null);
      setAct([]);
      haptic.impact("medium");
      const r = await playInstant<Result>(id, bet, {});
      if (!r) {
        setAuto(false);
        return;
      }
      const res = r.result;
      const sf = speedFactor();
      reels.current?.start();
      await sleep(140);
      await reels.current?.stop(res.grid);
      if (res.ankhs.length) {
        setHl(new Set(res.ankhs.map(([a, b]) => `${a}-${b}`)));
        sfx.gem();
        haptic.impact("light");
        // anima o medidor casa a casa
        let p = { ...res.prev };
        for (let i = 0; i < res.ankhs.length; i++) {
          p = { ...p, count: p.count + 1 };
          if (p.count >= per) p = { level: (p.level + 1) % prizes.length, count: 0 };
          setState((s) => ({ ...s, [String(bet)]: p }));
          await sleep(260 * sf);
        }
        await sleep(300 * sf);
      }
      setState((s) => ({ ...s, [String(bet)]: res.cur }));
      if (res.wins.length) {
        const cells = new Set<string>();
        res.wins.forEach((w) => w.cells.forEach(([a, b]) => cells.add(`${a}-${b}`)));
        setHl(cells);
        setAct(res.wins.map((w) => w.line));
        setWin(Math.floor(bet * res.lineWin));
        sfx.win(res.lineWin >= 5);
        await sleep(900 * sf);
      }
      for (const lu of res.levelUps) {
        setLevelUp(lu);
        sfx.jackpot();
        confetti();
        haptic.impact("heavy");
        setWin((w) => w + Math.floor(bet * lu.prize));
        await sleep(2200);
        setLevelUp(null);
      }
      setLastRound(r.roundId);
      initial.current = res.grid;
      if (bigWinTier(r.payout / bet)) await showBigWin(r.payout, r.payout / bet);
      else if (r.payout > 0) {
        coinBurst(document.getElementById("pyr-reels"), 8);
        await sleep(400);
        revealBalance();
      } else revealBalance();
    } catch {
      reels.current?.reset(initial.current);
      revealBalance();
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(), 400 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  return (
    <GameShell
      title="Jackpot em Pirâmide"
      game={id}
      bg={BG}
      info={
        <>
          <p><b>PIRÂMIDE DE JACKPOTS.</b> Cada Ankh dourado que aparece enche o medidor. A cada {per} Ankhs você sobe um degrau da pirâmide e ganha o prêmio do degrau: {prizes.map((p) => `${p}x`).join(" → ")}. Depois do topo, a pirâmide recomeça.</p>
          <p>O progresso fica salvo na sua conta e é separado para cada valor de aposta (trocar a aposta não leva o progresso junto).</p>
          <p>20 linhas pagam normalmente; a Esfinge (Wild) substitui os símbolos.</p>
          <p className="text-white/50 text-xs">RTP ≈ 96% no longo prazo, contando o medidor (calibrado por simulação).</p>
        </>
      }
    >
      <div className="relative flex-1 flex flex-col justify-center px-2 min-h-0">
        {/* pirâmide */}
        <div className="mx-auto w-full max-w-[360px] flex flex-col items-center gap-1 mb-2">
          {[...prizes].reverse().map((p, ri) => {
            const lvl = prizes.length - 1 - ri;
            const done = lvl < prog.level;
            const cur = lvl === prog.level;
            return (
              <div key={lvl} className={cls("relative rounded-md h-7 grid place-items-center overflow-hidden border", cur ? "border-yellow-300" : "border-yellow-900/60")} style={{ width: `${40 + ri * 15}%`, background: done ? "linear-gradient(180deg,#fde047,#a16207)" : "linear-gradient(180deg,#3f2d0a,#1c1405)" }}>
                {cur && <motion.div className="absolute inset-y-0 left-0" style={{ background: "linear-gradient(90deg,#facc15aa,#fde047)" }} animate={{ width: `${(prog.count / per) * 100}%` }} transition={{ type: "spring", damping: 20 }} />}
                <span className={cls("relative text-[11px] font-black", done ? "text-[#3b2300]" : cur ? "text-white" : "text-yellow-200/50")}>
                  {cur ? `${prog.count}/${per} · ` : ""}{fmtCompact(p * bet)}
                </span>
              </div>
            );
          })}
        </div>
        <div id="pyr-reels" className="relative mx-auto w-full max-w-[460px] rounded-[26px] p-[2.5px]" style={{ background: "linear-gradient(180deg,#fde68a,#ca8a04 50%,#1e3a8a)" }}>
          <div className="relative rounded-[24px] p-2 aspect-[5/3.3]" style={{ background: "#161004" }}>
            <Reels
              ref={reels}
              theme={id}
              reels={5}
              rows={3}
              initial={initial.current}
              pool={[2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 0, 10]}
              gap={5}
              aspect={1.08}
              highlight={hl}
              anticipationColor="#facc15"
              cellClass="rounded-xl bg-gradient-to-b from-yellow-200/[0.08] to-transparent"
              renderSymbol={(s) => <SymbolArt art={ART[s]} />}
            >
              <Paylines lines={lines} active={act} reels={5} rows={3} colors={["#facc15", "#60a5fa", "#fb923c", "#fde68a", "#93c5fd"]} />
            </Reels>
            <AnimatePresence>
              {levelUp && (
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center z-20 pointer-events-none">
                  <div className="bg-black/80 rounded-2xl px-5 py-3 border border-yellow-300/40 text-center">
                    <div className="text-xs font-black tracking-widest text-yellow-200/80">DEGRAU {levelUp.level + 1} COMPLETO</div>
                    <div className="font-display font-black text-3xl gold-text">+{fmt(levelUp.prize * bet)}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="h-12 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl" onTick={sfx.count} />
              <span className="text-xs font-black text-yellow-300">{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={play}>{busy ? "PARAR" : "GIRAR"}</Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press text-yellow-300">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
    </GameShell>
  );
}
