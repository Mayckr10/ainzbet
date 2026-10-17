import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SymbolArt } from "../../art/Symbol";
import { GEMAS } from "../../art/themes/themesA";
import { COLMEIA, CRISTAL, DOCERIA, MEGA } from "../../art/themes/themesH";
import { cls, fmt, fmtCompact, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance, speedFactor, useApp } from "../../lib/store";
import { confirm, haptic } from "../../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../../ui/effects";
import { GameShell, playInstant, shareRound } from "../../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../../ui/kit";
import { getSymbolBitmaps } from "../../ui/symbolCache";

type Cell = [number, number];
type Win = { symbol: number; cells: Cell[]; pay: number; ways?: number };
type Step = { grid: number[][]; wins: Win[]; mult: number; win: number; bombs?: { cell: Cell; value: number }[]; spots?: number[][] };
type Spin = { heights: number[]; steps: Step[]; win: number; scatters: number; freeSpinsWon: number; bombMult: number };
type Result = { base: Spin | null; free: Spin[]; multiplier: number; bought: boolean; freeSpinsTotal: number };

type Skin = { art: Record<number, ReactNode>; bg: string; frame: string; inner: string; accent: string; title: string; feature: string; desc: string };
export const CASCADE_SKINS: Record<string, Skin> = {
  "as-avalanche": {
    art: GEMAS,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(56,189,248,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(236,72,153,0.3), transparent 70%), linear-gradient(180deg,#0a0b1f,#05040d)",
    frame: "linear-gradient(180deg,#e0f2fe,#7c3aed 50%,#db2777)",
    inner: "#0b0a1d",
    accent: "#7dd3fc",
    title: "linear-gradient(180deg,#ffffff,#7dd3fc 45%,#a855f7)",
    feature: "AVALANCHE MULTIPLICADORA",
    desc: "Gemas vencedoras explodem e novas caem no lugar. A cada queda seguida o multiplicador sobe: x1, x2, x3, x5. Nos giros grátis: x3, x6, x9, x15!",
  },
  "as-doceria": {
    art: DOCERIA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(244,114,182,0.4), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(34,211,238,0.3), transparent 70%), linear-gradient(180deg,#1a0716,#0a0410)",
    frame: "linear-gradient(180deg,#fbcfe8,#ec4899 50%,#7e22ce)",
    inner: "#1a0718",
    accent: "#f9a8d4",
    title: "linear-gradient(180deg,#ffffff,#f9a8d4 45%,#c026d3)",
    feature: "PAGA EM QUALQUER LUGAR",
    desc: "8 ou mais doces iguais em qualquer posição pagam. Vencedores explodem e novos caem. Nos giros grátis caem bombas de 2x a 100x: elas somam e multiplicam o ganho da sequência.",
  },
  "as-mega": {
    art: MEGA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(185,28,28,0.35), transparent 70%), linear-gradient(180deg,#1a0f04,#090502)",
    frame: "linear-gradient(180deg,#fff7d6,#ca8a04 50%,#7f1d1d)",
    inner: "#140b04",
    accent: "#fde047",
    title: "linear-gradient(180deg,#fff7d6,#fde047 50%,#a16207)",
    feature: "ATÉ 117.649 FORMAS",
    desc: "Cada rolo mostra de 2 a 7 símbolos a cada giro: até 117.649 formas de ganhar. Vencedores caem e são substituídos. Nos giros grátis o multiplicador sobe +1 a cada queda e nunca zera.",
  },
  "as-colmeia": {
    art: COLMEIA,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(250,204,21,0.4), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(234,88,12,0.3), transparent 70%), linear-gradient(180deg,#1a1203,#0a0702)",
    frame: "linear-gradient(180deg,#fef08a,#f59e0b 50%,#78350f)",
    inner: "#161003",
    accent: "#fde047",
    title: "linear-gradient(180deg,#fffbeb,#fde047 45%,#b45309)",
    feature: "FAVOS MULTIPLICADORES",
    desc: "Grupos de 5 ou mais símbolos iguais encostados pagam. Onde um grupo explode, a casa vira favo; se explodir de novo vale 2x, depois 4x, 8x… até 128x. Nos giros grátis os favos ficam até o fim!",
  },
  "as-cristal": {
    art: CRISTAL,
    bg: "radial-gradient(80% 50% at 50% 0%, rgba(125,211,252,0.35), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(168,85,247,0.3), transparent 70%), linear-gradient(180deg,#080b18,#03040a)",
    frame: "linear-gradient(180deg,#e0f2fe,#64748b 50%,#4c1d95)",
    inner: "#0a0c18",
    accent: "#bae6fd",
    title: "linear-gradient(180deg,#ffffff,#bae6fd 45%,#a855f7)",
    feature: "MULTIPLICADOR QUE DOBRA",
    desc: "Grupos de 5 ou mais cristais encostados pagam e explodem. A cada queda seguida o multiplicador dobra: x1, x2, x4, x8… Nos giros grátis ele não volta para x1!",
  },
};

type Live = { id: number; s: number; c: number; r: number; fromR: number };
let uid = 0;

function useBitmaps(key: string, art: Record<number, ReactNode>, size: number) {
  const [map, setMap] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    if (size < 8) return;
    const syms = Object.keys(art).map(Number);
    const { bitmaps } = getSymbolBitmaps(`casc-${key}`, syms, (s) => <SymbolArt art={art[s]} />, size);
    let alive = true;
    Promise.all([...bitmaps.entries()].map(async ([s, p]) => [s, (await p).sharp] as const)).then((all) => alive && setMap(new Map(all.filter(([, u]) => !!u))));
    return () => {
      alive = false;
    };
  }, [key, Math.round(size / 8)]);
  return map;
}

export default function CascadeSlot({ id }: { id: string }) {
  const sk = CASCADE_SKINS[id];
  const cfg = useApp((s) => s.config?.adv?.cascades?.find((c: any) => c.id === id));
  const cols: number = cfg?.cols ?? 6;
  const rowsMax: number = cfg?.rows ?? 5;
  const [bet, setBet] = useBet(id, 100);
  const [cells, setCells] = useState<Live[]>(() => {
    const out: Live[] = [];
    for (let c = 0; c < cols; c++) for (let r = 0; r < rowsMax; r++) out.push({ id: ++uid, s: 2 + ((c * 3 + r * 5) % 7), c, r, fromR: r });
    return out;
  });
  const [heights, setHeights] = useState<number[]>(() => Array(cols).fill(rowsMax));
  const [hl, setHl] = useState<Set<string>>(new Set());
  const [dying, setDying] = useState<Set<number>>(new Set());
  const [mult, setMult] = useState(1);
  const [bombs, setBombs] = useState<Map<string, number>>(new Map());
  const [spots, setSpots] = useState<number[][] | null>(null);
  const [stepWin, setStepWin] = useState<{ amount: number; k: number } | null>(null);
  const [win, setWin] = useState(0);
  const [free, setFree] = useState<{ left: number; total: number; win: number } | null>(null);
  const [intro, setIntro] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ win: number; spins: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const busyRef = useRef(false);
  const fast = useRef(false);
  const introRes = useRef<() => void>(() => {});
  const sumRes = useRef<() => void>(() => {});
  const box = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 360, h: 300 });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDim({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  const colW = dim.w / cols;
  const cellH = (c: number) => dim.h / (heights[c] || rowsMax);
  const symSize = Math.min(colW, dim.h / rowsMax) * 0.9;
  const bmp = useBitmaps(id, sk.art, symSize);
  const sf = () => (fast.current ? 0.35 : 1) * speedFactor();

  /** Mostra uma grade nova caindo do topo. */
  async function dropIn(grid: number[][], hs: number[]) {
    setHeights(hs);
    const out: Live[] = [];
    grid.forEach((col, c) => col.forEach((s, r) => out.push({ id: ++uid, s, c, r, fromR: r - col.length - 1 - c * 0.35 })));
    setCells(out);
    sfx.whoosh();
    await sleep(520 * sf());
    sfx.reelStop();
  }

  async function playSteps(spin: Spin, inFree: boolean) {
    await dropIn(spin.steps[0].grid, spin.heights);
    let cur = spin.steps[0].grid;
    let liveCells: Live[] = [];
    setCells((c) => (liveCells = c));
    await sleep(10);
    for (let k = 0; k < spin.steps.length; k++) {
      const st = spin.steps[k];
      setMult(st.mult);
      if (st.bombs) setBombs(new Map(st.bombs.map((b) => [`${b.cell[0]}:${b.cell[1]}`, b.value])));
      if (st.spots) setSpots(st.spots);
      if (!st.wins.length) break;
      const cellsWin = new Set<string>();
      st.wins.forEach((w) => w.cells.forEach(([c, r]) => cellsWin.add(`${c}:${r}`)));
      setHl(cellsWin);
      const amount = Math.floor(bet * st.win);
      setStepWin({ amount, k });
      sfx.win(st.win >= 5);
      haptic.impact("medium");
      await sleep(760 * sf());
      // explode
      const deadIds = new Set(liveCells.filter((x) => cellsWin.has(`${x.c}:${x.r}`)).map((x) => x.id));
      setDying(deadIds);
      sfx.explode();
      await sleep(320 * sf());
      setWin((x) => x + amount);
      if (inFree) setFree((f) => (f ? { ...f, win: f.win + amount } : f));
      // queda: sobreviventes descem, novos entram por cima
      const next = spin.steps[k + 1]?.grid;
      if (!next) break;
      const nextCells: Live[] = [];
      for (let c = 0; c < cur.length; c++) {
        const col = liveCells.filter((x) => x.c === c).sort((a, b) => a.r - b.r);
        const keep = col.filter((x) => !deadIds.has(x.id));
        const add = cur[c].length - keep.length;
        for (let i = 0; i < add; i++) nextCells.push({ id: ++uid, s: next[c][i], c, r: i, fromR: i - add - 0.5 });
        keep.forEach((x, i) => nextCells.push({ ...x, fromR: x.r, r: add + i, s: next[c][add + i] }));
      }
      setDying(new Set());
      setHl(new Set());
      setStepWin(null);
      liveCells = nextCells;
      setCells(nextCells);
      cur = next;
      if (id === "as-avalanche" || id === "as-cristal" || (id === "as-mega" && inFree)) setBanner(null);
      await sleep(430 * sf());
      sfx.reelStop();
    }
    setHl(new Set());
    setStepWin(null);
    if (spin.bombMult > 1 && spin.win > 0) {
      setBanner(`BOMBAS x${spin.bombMult}`);
      sfx.jackpot();
      haptic.impact("heavy");
      const extra = Math.floor(bet * spin.win) - Math.floor(bet * (spin.win / spin.bombMult));
      setWin((x) => x + extra);
      if (inFree) setFree((f) => (f ? { ...f, win: f.win + extra } : f));
      await sleep(1300 * sf());
      setBanner(null);
    }
  }

  async function play(buy = false) {
    if (busyRef.current) {
      fast.current = true;
      return;
    }
    const cost = buy ? bet * (cfg?.buyPrice ?? 100) : bet;
    if (buy && !(await confirm(`Comprar os giros grátis por ${fmt(cost)} fichas?`))) return;
    busyRef.current = true;
    fast.current = false;
    setBusy(true);
    try {
      setWin(0);
      setBombs(new Map());
      if (!free) setSpots(null);
      haptic.impact("medium");
      const r = await playInstant<Result>(id, bet, buy ? { buy: true } : {}, cost);
      if (!r) {
        setAuto(false);
        return;
      }
      const res = r.result;
      if (res.base) await playSteps(res.base, false);
      if (res.free.length) {
        await sleep(300);
        sfx.freeSpins();
        confetti();
        const first = buy ? Math.min(...Object.values(cfg?.freeSpins ?? { 4: 10 }).map(Number)) : res.base!.freeSpinsWon;
        await new Promise<void>((ok) => {
          introRes.current = ok;
          setIntro(first);
        });
        let total = first;
        setFree({ left: first, total, win: 0 });
        setSpots(null);
        for (const s of res.free) {
          setFree((f) => (f ? { ...f, left: f.left - 1 } : f));
          await playSteps(s, true);
          if (s.freeSpinsWon) {
            total += s.freeSpinsWon;
            setFree((f) => (f ? { ...f, left: f.left + s.freeSpinsWon, total } : f));
            setBanner(`+${s.freeSpinsWon} GIROS`);
            sfx.freeSpins();
            await sleep(900);
            setBanner(null);
          }
        }
        const fsWin = Math.floor(bet * res.free.reduce((a, s) => a + s.win, 0));
        await new Promise<void>((ok) => {
          sumRes.current = ok;
          setSummary({ win: fsWin, spins: res.free.length });
        });
        setFree(null);
        setSpots(null);
        setMult(1);
      }
      setLastRound(r.roundId);
      if (bigWinTier(r.payout / bet) && r.payout > cost) await showBigWin(r.payout, r.payout / bet, res.free.length ? "Giros grátis" : undefined);
      else if (r.payout > 0) {
        coinBurst(box.current, r.payout / bet >= 3 ? 18 : 9);
        await sleep(500);
        revealBalance();
      } else revealBalance();
    } catch {
      revealBalance();
      setAuto(false);
      setFree(null);
      setIntro(null);
      setSummary(null);
    } finally {
      busyRef.current = false;
      fast.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(false), 450 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);
  useEffect(() => {
    if (intro == null || !auto) return;
    const t = setTimeout(() => {
      setIntro(null);
      introRes.current();
    }, 2600);
    return () => clearTimeout(t);
  }, [intro, auto]);
  useEffect(() => {
    if (!summary) return;
    const t = setTimeout(() => {
      setSummary(null);
      sumRes.current();
    }, auto ? 3200 : 6000);
    return () => clearTimeout(t);
  }, [summary, auto]);

  const ways = heights.reduce((a, h) => a * h, 1);
  const multLabel =
    cfg?.mult === "gonzo" ? (free ? [3, 6, 9, 15] : [1, 2, 3, 5]) : null;

  return (
    <GameShell title={cfg?.name ?? id} game={id} bg={sk.bg} info={<Rules id={id} cfg={cfg} bet={bet} />}>
      <div className="relative flex-1 flex flex-col justify-center px-2 min-h-0">
        <div className="h-[58px] flex items-center justify-center">
          {free ? (
            <div className="rounded-2xl px-4 py-1.5 flex gap-4 items-center bg-black/45 border" style={{ borderColor: sk.accent + "66" }}>
              <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">GIROS</div><motion.div key={free.left} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display font-black text-2xl" style={{ color: sk.accent }}>{free.left}</motion.div></div>
              <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">BÔNUS</div><CountUp value={free.win} className="font-display font-black text-lg text-white" /></div>
              {(cfg?.mult === "double" || cfg?.mult === "plus1") && <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">MULT.</div><motion.div key={mult} initial={{ scale: 1.7 }} animate={{ scale: 1 }} className="font-display font-black text-2xl text-[#fde047]">x{mult}</motion.div></div>}
            </div>
          ) : (
            <div className="text-center">
              <div className="font-display font-black text-[15px] bg-clip-text text-transparent" style={{ backgroundImage: sk.title }}>{sk.feature}</div>
              <div className="text-[10.5px] font-bold text-white/55">{cfg?.mega ? `${fmt(ways)} formas neste giro` : cfg?.mode === "cluster" ? `grupos de ${cfg?.min}+ · até 50.000x` : cfg?.mode === "anywhere" ? "8+ iguais em qualquer lugar · até 50.000x" : `${fmt(ways)} formas · até 50.000x`}</div>
            </div>
          )}
        </div>
        {multLabel && (
          <div className="flex justify-center gap-1.5 mb-2">
            {multLabel.map((m, i) => (
              <div key={m} className={cls("rounded-lg px-2.5 py-0.5 text-xs font-black transition-all", mult === m ? "scale-110 text-[#1c1917]" : "bg-white/10 text-white/50")} style={mult === m ? { background: sk.accent } : undefined}>
                x{m}
              </div>
            ))}
          </div>
        )}
        {!multLabel && cfg?.mult === "double" && !free && (
          <div className="flex justify-center mb-2"><motion.div key={mult} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="rounded-lg px-3 py-0.5 text-sm font-black text-[#1c1917]" style={{ background: sk.accent }}>x{mult}</motion.div></div>
        )}
        <div className="relative mx-auto w-full max-w-[460px] rounded-[24px] p-[2.5px]" style={{ background: sk.frame }}>
          <div className="relative rounded-[22px] p-2" style={{ background: sk.inner }}>
            <div ref={box} className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: `${cols} / ${cfg?.mega ? 5.2 : rowsMax}` }}>
              {/* casas multiplicadoras */}
              {spots &&
                spots.map((col, c) =>
                  col.map((v, r) =>
                    v ? (
                      <div key={`sp${c}-${r}`} className="absolute rounded-lg grid place-items-center" style={{ left: c * colW + 1, top: r * cellH(c) + 1, width: colW - 2, height: cellH(c) - 2, background: v >= 2 ? "rgba(250,204,21,0.28)" : "rgba(250,204,21,0.12)", boxShadow: v >= 2 ? "inset 0 0 0 2px #facc15" : "inset 0 0 0 1px rgba(250,204,21,0.4)" }}>
                        {v >= 2 && <span className="absolute top-0.5 right-1 text-[10px] font-black text-[#fde047]">x{v}</span>}
                      </div>
                    ) : null,
                  ),
                )}
              {cells.map((x) => {
                const h = cellH(x.c);
                const win = hl.has(`${x.c}:${x.r}`);
                const dead = dying.has(x.id);
                const bomb = x.s === 10 ? bombs.get(`${x.c}:${x.r}`) : undefined;
                const size = Math.min(colW, h) * 0.92;
                return (
                  <motion.div
                    key={x.id}
                    className="absolute grid place-items-center"
                    style={{ left: x.c * colW, width: colW, height: h }}
                    initial={{ y: x.fromR * h, opacity: x.fromR < 0 ? 0.6 : 1 }}
                    animate={{ y: x.r * h, opacity: dead ? 0 : 1, scale: dead ? 1.5 : win ? [1, 1.12, 1] : 1 }}
                    transition={{ y: { type: "spring", damping: 17, stiffness: 210, mass: 0.7 }, scale: win ? { repeat: Infinity, duration: 0.6 } : { duration: 0.25 }, opacity: { duration: 0.25 } }}
                  >
                    <div className={cls("relative", win && "drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]")} style={{ width: size, height: size }}>
                      {bmp.get(x.s) ? <img src={bmp.get(x.s)} className="w-full h-full" draggable={false} /> : <SymbolArt art={sk.art[x.s]} />}
                      {bomb && <span className="absolute inset-0 grid place-items-center font-display font-black text-white" style={{ fontSize: size * 0.3, textShadow: "0 2px 4px #000" }}>{bomb}x</span>}
                    </div>
                    {win && <div className="absolute inset-0.5 rounded-lg pointer-events-none" style={{ boxShadow: `inset 0 0 0 2px ${sk.accent}` }} />}
                  </motion.div>
                );
              })}
              <AnimatePresence>
                {stepWin && stepWin.amount > 0 && (
                  <motion.div key={stepWin.k} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="rounded-2xl bg-black/65 px-4 py-1.5 border border-white/10 text-center">
                      <div className="font-display font-black text-2xl text-white">+{fmt(stepWin.amount)}</div>
                      {mult > 1 && <div className="text-xs font-black" style={{ color: sk.accent }}>x{mult}</div>}
                    </div>
                  </motion.div>
                )}
                {banner && (
                  <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }} className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="bg-black/70 rounded-2xl px-5 py-2.5 border border-white/10">
                      <div className="font-display font-black text-2xl bg-clip-text text-transparent" style={{ backgroundImage: sk.title }}>{banner}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {cfg?.mega && (
              <div className="grid mt-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
                {heights.map((h, i) => <div key={i} className="text-center text-[9px] font-black text-white/45">{h}</div>)}
              </div>
            )}
          </div>
        </div>
        <div className="h-12 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl text-white" onTick={sfx.count} />
              <span className="text-xs font-black" style={{ color: sk.accent }}>{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={() => play(false)}>{busy ? "RÁPIDO" : "GIRAR"}</Btn>
          <Btn variant="violet" size="lg" className="w-[110px] text-[11px] leading-tight" disabled={busy} onClick={() => play(true)}>
            <span>COMPRAR<br />BÔNUS {cfg?.buyPrice ?? ""}x</span>
          </Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press" style={{ color: sk.accent }}>COMPARTILHAR NO GRUPO ↗</button>}
      </div>
      <AnimatePresence>
        {intro != null && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-center">
              <div className="w-28 h-28 mx-auto"><SymbolArt art={sk.art[1]} /></div>
              <div className="font-display font-black text-6xl mt-2 bg-clip-text text-transparent" style={{ backgroundImage: sk.title }}>{intro}</div>
              <div className="font-display font-black text-2xl">GIROS GRÁTIS</div>
              <p className="text-sm text-white/70 mt-4 max-w-xs mx-auto">{sk.desc}</p>
              <Btn variant="gold" size="xl" className="mt-6 w-60" pulse onClick={() => { setIntro(null); introRes.current(); }}>COMEÇAR</Btn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {summary && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSummary(null); sumRes.current(); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-6 w-full max-w-sm text-center border" style={{ background: sk.inner, borderColor: sk.accent + "88" }}>
              <div className="text-xs font-black tracking-[0.3em] text-white/60">BÔNUS ENCERRADO</div>
              <div className="mt-3 flex items-center justify-center gap-2"><ChipIcon size={30} /><CountUp value={summary.win} duration={1.4} className="font-display font-black text-4xl text-white" /></div>
              <div className="font-extrabold" style={{ color: sk.accent }}>{fmtMult(summary.win / bet)} · {summary.spins} giros</div>
              <div className="text-[11px] text-white/45 mt-4">Toque para continuar</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}

function Rules({ id, cfg, bet }: { id: string; cfg: any; bet: number }) {
  const sk = CASCADE_SKINS[id];
  if (!cfg) return null;
  const syms = Object.keys(cfg.pays).map(Number);
  const head = cfg.mode === "ways" ? ["3", "4", "5", "6"] : cfg.mode === "anywhere" ? ["8-9", "10-11", "12+"] : ["5", "6", "7", "8", "9", "10", "11+", "13+", "15+"];
  return (
    <>
      <p><b>{sk.feature}.</b> {sk.desc}</p>
      <p>
        {cfg.mode === "ways"
          ? "Ganha com símbolos iguais em rolos vizinhos a partir da esquerda, em qualquer linha. O prêmio é multiplicado pelo número de formas (combinações)."
          : cfg.mode === "anywhere"
            ? `${cfg.min} ou mais símbolos iguais em qualquer posição pagam.`
            : `Grupos de ${cfg.min} ou mais símbolos iguais encostados (horizontal ou vertical) pagam.`}{" "}
        Valores para a aposta atual:
      </p>
      <div className="flex flex-col gap-1.5">
        {syms.map((s) => (
          <div key={s} className="glass rounded-xl p-1.5 flex items-center gap-2">
            <div className="w-9 h-9 shrink-0"><SymbolArt art={sk.art[s]} /></div>
            <div className="flex-1 grid gap-x-1 text-[10px] leading-tight" style={{ gridTemplateColumns: `repeat(${Math.min(5, head.length)}, minmax(0,1fr))` }}>
              {cfg.pays[s].map((v: number, i: number) => (
                <div key={i}><span className="text-white/50">{head[i]}:</span> <b className="text-gold-300">{fmtCompact(v * bet)}</b></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {cfg.mode === "ways" && <p className="text-white/60 text-xs">{cfg.symbols[0]} substitui todos os símbolos de pagamento.</p>}
      <p><b>{cfg.symbols[1]}</b>: {Object.entries(cfg.freeSpins).map(([k, v]) => `${k} = ${v} giros`).join(" · ")} (+5 ao repetir no bônus).</p>
      <p><b>Comprar bônus</b>: {cfg.buyPrice}x a aposta.</p>
      <p className="text-white/50 text-xs">RTP ≈ 96% (calibrado por simulação). Prêmio máximo 50.000x. Resultado gerado no servidor (provably fair).</p>
    </>
  );
}
