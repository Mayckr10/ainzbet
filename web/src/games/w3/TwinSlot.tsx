import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SymbolArt } from "../../art/Symbol";
import { DUPLO } from "../../art/themes/themesH";
import { fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance, speedFactor, useApp } from "../../lib/store";
import { confirm, haptic } from "../../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../../ui/effects";
import { GameShell, playInstant, shareRound } from "../../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../../ui/Reels";

type Cell = [number, number];
type LineWin = { line: number; cells: Cell[] };
type Spin = { top: number[][]; bottom: number[][]; copied: Cell[]; winsTop: LineWin[]; winsBottom: LineWin[]; win: number; mult: number; scatters: number; freeSpinsWon: number };
type Result = { base: Spin | null; free: Spin[]; multiplier: number; bought: boolean; freeSpinsTotal: number };
const ACCENT = "#c4b5fd";
const BG = "radial-gradient(80% 50% at 50% 0%, rgba(99,102,241,0.4), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(236,72,153,0.3), transparent 70%), linear-gradient(180deg,#0b0a22,#04030c)";

export default function TwinSlot() {
  const id = "as-duplo";
  const cfg = useApp((s) => s.config?.adv?.twin);
  const lines = useApp((s) => s.config?.adv?.lines ?? []);
  const top = useRef<ReelsHandle>(null);
  const bottom = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet(id, 100);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [hlTop, setHlTop] = useState<Set<string> | null>(null);
  const [hlBot, setHlBot] = useState<Set<string> | null>(null);
  const [lt, setLt] = useState<number[]>([]);
  const [lb, setLb] = useState<number[]>([]);
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [win, setWin] = useState(0);
  const [free, setFree] = useState<{ left: number; win: number } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const busyRef = useRef(false);
  const init = () => Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => 2 + Math.floor(Math.random() * 8)));
  const iTop = useRef(init());
  const iBot = useRef(init());

  async function show(s: Spin, inFree: boolean) {
    const sf = speedFactor();
    setHlTop(null);
    setHlBot(null);
    setLt([]);
    setLb([]);
    setCopied(new Set());
    top.current?.start();
    await sleep(90);
    bottom.current?.start();
    await sleep(120);
    // a grade de baixo mostra primeiro o resultado sem as cópias
    const rawBottom = s.bottom.map((col, c) => col.map((x, r) => (s.copied.some(([a, b]) => a === c && b === r) && !inFree ? 2 + ((c + r) % 8) : x)));
    await Promise.all([top.current?.stop(s.top), sleep(260).then(() => bottom.current?.stop(inFree ? s.bottom : rawBottom))]);
    if (s.copied.length) {
      setCopied(new Set(s.copied.map(([a, b]) => `${a}-${b}`)));
      setBanner("ESPELHO!");
      sfx.arcane();
      haptic.impact("medium");
      if (!inFree) bottom.current?.setGrid(s.bottom);
      await sleep(800 * sf);
      setBanner(null);
    }
    const toSet = (ws: LineWin[]) => {
      const st = new Set<string>();
      ws.forEach((w) => w.cells.forEach(([a, b]) => st.add(`${a}-${b}`)));
      return st;
    };
    if (s.winsTop.length || s.winsBottom.length) {
      setHlTop(toSet(s.winsTop));
      setHlBot(toSet(s.winsBottom));
      setLt(s.winsTop.map((w) => w.line));
      setLb(s.winsBottom.map((w) => w.line));
      sfx.win(s.win >= 5);
      haptic.success();
      const amt = Math.floor(bet * s.win);
      setWin((x) => x + amt);
      if (inFree) setFree((f) => (f ? { ...f, win: f.win + amt } : f));
      await sleep(1000 * sf);
    }
  }

  async function play(buy = false) {
    if (busyRef.current) {
      top.current?.hurry();
      bottom.current?.hurry();
      return;
    }
    const cost = buy ? bet * (cfg?.buyPrice ?? 50) : bet;
    if (buy && !(await confirm(`Comprar os giros grátis por ${fmt(cost)} fichas?`))) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setWin(0);
      haptic.impact("medium");
      const r = await playInstant<Result>(id, bet, buy ? { buy: true } : {}, cost);
      if (!r) {
        setAuto(false);
        return;
      }
      const res = r.result;
      if (res.base) await show(res.base, false);
      if (res.free.length) {
        sfx.freeSpins();
        confetti();
        setBanner(`${res.freeSpinsTotal} GIROS · x2`);
        await sleep(1600);
        setBanner(null);
        let left = buy ? cfg?.freeSpins ?? 10 : res.base!.freeSpinsWon;
        setFree({ left, win: 0 });
        for (const s of res.free) {
          left--;
          setFree((f) => (f ? { ...f, left } : f));
          await show(s, true);
          if (s.freeSpinsWon) {
            left += 5;
            setFree((f) => (f ? { ...f, left } : f));
            setBanner("+5 GIROS");
            await sleep(900);
            setBanner(null);
          }
        }
        await sleep(600);
        setFree(null);
      }
      setLastRound(r.roundId);
      if (bigWinTier(r.payout / bet) && r.payout > cost) await showBigWin(r.payout, r.payout / bet);
      else if (r.payout > 0) {
        coinBurst(document.getElementById("twin"), 10);
        await sleep(500);
        revealBalance();
      } else revealBalance();
    } catch {
      top.current?.reset(iTop.current);
      bottom.current?.reset(iBot.current);
      setFree(null);
      revealBalance();
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(false), 420 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);

  const grid = (ref: React.RefObject<ReelsHandle | null>, initial: number[][], hl: Set<string> | null, active: number[], mark: boolean, key: string) => (
    <div className="relative rounded-[20px] p-[2px]" style={{ background: "linear-gradient(180deg,#e0e7ff,#6366f1 50%,#db2777)" }}>
      <div className="relative rounded-[18px] p-1.5 aspect-[5/3.15]" style={{ background: "#0d0b26" }}>
        <Reels
          ref={ref}
          theme={`${id}-${key}`}
          reels={5}
          rows={3}
          initial={initial}
          pool={[2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 0, 1]}
          gap={4}
          aspect={1.12}
          highlight={hl}
          anticipationColor={ACCENT}
          cellClass="rounded-lg bg-gradient-to-b from-indigo-200/[0.07] to-transparent"
          renderSymbol={(s) => <SymbolArt art={DUPLO[s]} />}
          cellOverlay={(r, w) => (mark && copied.has(`${r}-${w}`) ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-lg pointer-events-none" style={{ boxShadow: `inset 0 0 0 2.5px ${ACCENT}, 0 0 12px ${ACCENT}` }} /> : null)}
        >
          <Paylines lines={lines} active={active} reels={5} rows={3} colors={[ACCENT, "#f9a8d4", "#fde047", "#fff", "#67e8f9"]} />
        </Reels>
      </div>
    </div>
  );

  return (
    <GameShell
      title="Duplo Slot"
      game={id}
      bg={BG}
      info={
        <>
          <p><b>DUAS GRADES LIGADAS.</b> Você joga duas grades 5×3 ao mesmo tempo (a aposta é dividida entre as 40 linhas). Todo Espelho (Wild) que cai na grade de cima é copiado para a mesma posição da grade de baixo.</p>
          <p>3 ou mais Portais nas duas grades dão {cfg?.freeSpins ?? 10} giros grátis: os Espelhos passam a copiar nos dois sentidos e todos os ganhos valem x2. Comprar bônus: {cfg?.buyPrice}x.</p>
          <p className="text-white/50 text-xs">RTP ≈ 96% (calibrado por simulação). Prêmio máximo 50.000x.</p>
        </>
      }
    >
      <div id="twin" className="relative flex-1 flex flex-col justify-center gap-2 px-2 min-h-0">
        <div className="h-10 flex items-center justify-center">
          {free ? (
            <div className="rounded-2xl px-4 py-1 flex gap-4 items-center bg-black/45 border border-indigo-300/30">
              <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">GIROS</div><div className="font-display font-black text-xl text-indigo-200">{free.left}</div></div>
              <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">BÔNUS x2</div><CountUp value={free.win} className="font-display font-black text-lg" /></div>
            </div>
          ) : (
            <div className="font-display font-black text-[15px] bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(180deg,#fff,#c4b5fd 50%,#db2777)" }}>ESPELHO ENTRE GRADES</div>
          )}
        </div>
        <div className="mx-auto w-full max-w-[400px] flex flex-col gap-2 relative">
          {grid(top, iTop.current, hlTop, lt, false, "a")}
          <div className="flex justify-center -my-1.5 z-10"><span className="rounded-full bg-indigo-500/80 px-2 text-[10px] font-black">▼ WILDS COPIADOS ▼</span></div>
          {grid(bottom, iBot.current, hlBot, lb, true, "b")}
          <AnimatePresence>
            {banner && (
              <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }} className="absolute inset-0 grid place-items-center pointer-events-none z-20">
                <div className="bg-black/75 rounded-2xl px-5 py-2.5 border border-white/10">
                  <div className="font-display font-black text-2xl bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(180deg,#fff,#c4b5fd 50%,#db2777)" }}>{banner}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="h-10 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl" onTick={sfx.count} />
              <span className="text-xs font-black text-indigo-200">{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={() => play(false)}>{busy ? "PARAR" : "GIRAR"}</Btn>
          <Btn variant="violet" size="lg" className="w-[110px] text-[11px] leading-tight" disabled={busy} onClick={() => play(true)}>
            <span>COMPRAR<br />BÔNUS {cfg?.buyPrice ?? ""}x</span>
          </Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press text-indigo-200">COMPARTILHAR NO GRUPO ↗</button>}
      </div>
    </GameShell>
  );
}
