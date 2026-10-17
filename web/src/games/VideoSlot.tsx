import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { SymbolArt } from "../art/Symbol";
import { SLOT_THEMES } from "../art/themes";
import { cls, fmt, fmtCompact, fmtMult, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, speedFactor, useApp } from "../lib/store";
import { confirm, haptic } from "../lib/tg";
import { bigWinTier, coinBurst, confetti, showBigWin } from "../ui/effects";
import { GameShell, playInstant, shareRound } from "../ui/GameShell";
import { BetInput, Btn, ChipIcon, CountUp, useBet } from "../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../ui/Reels";

type LineWin = { line: number; symbol: number; count: number; mult: number; cells: [number, number][] };
type VSpin = {
  grid: number[][];
  final: number[][];
  wins: LineWin[];
  scatter: { count: number; cells: [number, number][]; mult: number };
  wildMults: number[][] | null;
  orbs: { cell: [number, number]; value: number }[];
  expanded: { symbol: number; reels: number[]; mult: number } | null;
  effects: { expandedWildReels: number[]; sticky: [number, number][]; randomWilds: [number, number][]; walking?: [number, number][]; bitten?: [number, number][]; grown?: [number, number][]; giant?: number };
  cellMults?: number[][] | null;
  collected?: number;
  trail?: { from: number; to: number; prize: number };
  spinMult: number;
  multiplier: number;
  freeSpinsWon: number;
};
type Result = { base: VSpin | null; free: VSpin[]; special: number; specials?: number[]; duel?: { rounds: boolean[]; mult: number }; variant?: string | null; multiplier: number; bought: boolean; freeSpinsTotal: number };

export default function VideoSlot({ id }: { id: string }) {
  const theme = SLOT_THEMES[id];
  const cfg = useApp((s) => s.config?.videoSlots?.find((v: any) => v.id === id));
  const reels = useRef<ReelsHandle>(null);
  const [bet, setBet] = useBet(id, 100);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [hl, setHl] = useState<Set<string> | null>(null);
  const [lines, setLines] = useState<number[]>([]);
  const [wm, setWm] = useState<number[][] | null>(null);
  const [orbs, setOrbs] = useState<Map<string, number>>(new Map());
  const [sticky, setSticky] = useState<Set<string>>(new Set());
  const [win, setWin] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [free, setFree] = useState<{ left: number; total: number; win: number; mult: number } | null>(null);
  const [intro, setIntro] = useState<{ spins: number; special: number; specials?: number[] } | null>(null);
  const [special, setSpecial] = useState(-1);
  const [specials, setSpecials] = useState<number[]>([]);
  const [summary, setSummary] = useState<{ win: number; spins: number; bet: number } | null>(null);
  const [auto, setAuto] = useState(false);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const [variant, setVariantState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`cc_var_${id}`);
    } catch {
      return null;
    }
  });
  const variants: string[] | null = cfg?.variants ? Object.keys(cfg.variants) : null;
  const curVariant = variants ? (variant && variants.includes(variant) ? variant : variants[0]) : null;
  const setVariant = (v: string) => {
    setVariantState(v);
    try {
      localStorage.setItem(`cc_var_${id}`, v);
    } catch {}
  };
  const vcfg = curVariant && cfg?.variants ? { ...cfg, ...cfg.variants[curVariant] } : cfg;
  const [cm, setCm] = useState<number[][] | null>(null);
  const [walkers, setWalkers] = useState<Set<string>>(new Set());
  const [trailPos, setTrailPos] = useState(0);
  const [duel, setDuel] = useState<{ rounds: boolean[]; mult: number; shown: number } | null>(null);
  const [giant, setGiant] = useState<number | null>(null);
  const money = cfg?.feature === "money_collect";
  const introResolve = useRef<() => void>(() => {});
  const summaryResolve = useRef<() => void>(() => {});
  const autoRef = useRef(false);
  autoRef.current = auto;

  const pool = useMemo(() => (cfg?.feature === "mult_orbs" || cfg?.feature === "money_collect" ? [2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 0, 1, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 6, 7, 8, 9, 0, 1]), [cfg?.feature]);
  const initial = useRef(Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => 2 + Math.floor(Math.random() * 8))));

  const live = cfg?.feature === "mult_wilds" || (cfg?.feature === "dual_mode" && curVariant === "fogo") ? [0] : cfg?.feature === "mult_orbs" || money ? [10] : undefined;

  async function showSpin(s: VSpin, b: number, inFree: boolean) {
    const sf = speedFactor();
    setHl(null);
    setLines([]);
    setWm(null);
    setOrbs(new Map());
    setCm(null);
    setGiant(null);
    setBanner(null);
    reels.current?.start();
    await sleep(140);
    const anticipate: number[] = [];
    let sc = 0;
    s.grid.forEach((col, r) => {
      if (sc >= 2 && r >= 2) anticipate.push(r);
      if (col.includes(1)) sc++;
    });
    await reels.current?.stop(s.grid, { anticipate });

    // efeitos que mudam a grade (expandir, prender, cair wilds)
    const changedGrid = JSON.stringify(s.final) !== JSON.stringify(s.grid);
    if (changedGrid) {
      if (s.effects.expandedWildReels.length) setBanner(`${theme.featureTitle.split(" ")[0]} EXPANDE!`);
      else if (s.effects.randomWilds.length) setBanner(`+${s.effects.randomWilds.length} WILD`);
      else if (s.effects.bitten?.length) setBanner(`MORDIDA! +${s.effects.bitten.length} WILD`);
      else if (s.effects.grown?.length) setBanner("CRESCEU!");
      else if (s.effects.walking?.length) setBanner("AVANÇAR!");
      else if (s.effects.giant != null) setGiant(s.effects.giant);
      sfx.gem();
      haptic.impact("medium");
      reels.current?.setGrid(s.final);
      await sleep(650 * sf);
      setBanner(null);
    }
    if (s.effects.sticky.length) setSticky(new Set(s.effects.sticky.map(([a, c]) => `${a}-${c}`)));
    if (s.effects.walking) setWalkers(new Set(s.effects.walking.map(([a, c]) => `${a}-${c}`)));
    if (s.cellMults && s.cellMults.some((c) => c.some((v) => v > 0))) {
      setCm(s.cellMults);
      setBanner("CORTE!");
      sfx.whoosh();
      haptic.impact("heavy");
      await sleep(550 * sf);
      setBanner(null);
    }
    if (s.wildMults && s.wildMults.some((c) => c.some((v) => v > 0))) {
      setWm(s.wildMults);
      sfx.pop();
      await sleep(450 * sf);
    }
    if (s.orbs.length) {
      setOrbs(new Map(s.orbs.map((o) => [`${o.cell[0]}-${o.cell[1]}`, o.value])));
      sfx.arcane();
      await sleep(500 * sf);
    }
    if (s.collected) {
      setHl(new Set([...s.orbs.map((o) => `${o.cell[0]}-${o.cell[1]}`), ...s.final.flatMap((col, r) => col.map((x, w) => (x === 0 ? `${r}-${w}` : "")).filter(Boolean))]));
      setBanner(`COLETA +${fmt(b * s.collected)}`);
      sfx.coin();
      haptic.impact("heavy");
      await sleep(1000 * sf);
      setBanner(null);
      setHl(null);
    }
    if (s.trail) {
      setTrailPos(s.trail.to);
      setBanner(`+${fmt(b * s.trail.prize)}`);
      sfx.gem();
      await sleep(700 * sf);
      setBanner(null);
    }

    // vitórias
    const cells = new Set<string>();
    s.wins.forEach((w) => w.cells.forEach(([a, c]) => cells.add(`${a}-${c}`)));
    if (s.scatter.count >= 3) s.scatter.cells.forEach(([a, c]) => cells.add(`${a}-${c}`));
    if (s.orbs.length && s.multiplier > 0) s.orbs.forEach((o) => cells.add(`${o.cell[0]}-${o.cell[1]}`));
    const amount = Math.floor(b * s.multiplier);
    if (cells.size) {
      setHl(cells);
      setLines(s.wins.map((w) => w.line));
      if (s.spinMult > 1 && amount > 0) setBanner(`x${s.spinMult}`);
      if (amount > 0) {
        sfx.win(s.multiplier >= 5);
        haptic.success();
      } else sfx.scatter();
      await sleep((s.wins.length > 2 ? 950 : 720) * sf);
    }
    // livro: o símbolo especial expande nos rolos e paga em todas as linhas
    if (s.expanded) {
      const sec = (s.expanded as any).second as { symbol: number; reels: number[] } | undefined;
      const g = s.final.map((col, r) => (s.expanded!.reels.includes(r) ? [s.expanded!.symbol, s.expanded!.symbol, s.expanded!.symbol] : sec?.reels.includes(r) ? [sec.symbol, sec.symbol, sec.symbol] : col));
      if (sec) s.expanded.reels = [...new Set([...s.expanded.reels, ...sec.reels])];
      setLines([]);
      setBanner("SÍMBOLO EXPANDE!");
      sfx.freeSpins();
      haptic.impact("heavy");
      reels.current?.setGrid(g);
      setHl(new Set(s.expanded.reels.flatMap((r) => [0, 1, 2].map((w) => `${r}-${w}`))));
      await sleep(1100 * sf);
    }
    if (amount > 0) {
      setWin((x) => x + amount);
      if (inFree) setFree((f) => (f ? { ...f, win: f.win + amount } : f));
    }
    setBanner(null);
  }

  async function play(buy = false) {
    if (busyRef.current) {
      reels.current?.hurry();
      return;
    }
    const cost = buy ? bet * (vcfg?.buyPrice ?? 100) : bet;
    if (buy && !(await confirm(`Comprar os giros grátis por ${fmt(cost)} fichas?`))) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await run(buy, cost);
    } catch {
      reels.current?.reset(initial.current);
      setFree(null);
      setIntro(null);
      setSummary(null);
      revealBalance();
      setAuto(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function run(buy: boolean, cost: number) {
    setWin(0);
    setSticky(new Set());
    setWalkers(new Set());
    setTrailPos(0);
    haptic.impact("medium");
    if (buy) setAuto(false);
    const params: any = buy ? { buy: true } : {};
    if (curVariant) params.variant = curVariant;
    const r = await playInstant<Result>(id, bet, params, cost);
    if (!r) {
      setAuto(false);
      return;
    }
    const res = r.result;
    if (res.base) await showSpin(res.base, bet, false);
    if (res.free.length) {
      await sleep(300);
      sfx.freeSpins();
      confetti();
      const first = buy ? cfg?.freeSpins?.[3] ?? 10 : res.base?.freeSpinsWon ?? 10;
      await new Promise<void>((resolve) => {
        introResolve.current = resolve;
        setSpecial(res.special);
        setSpecials(res.specials ?? (res.special >= 2 ? [res.special] : []));
        setIntro({ spins: first, special: res.special, specials: res.specials });
      });
      let total = first;
      setFree({ left: first, total, win: 0, mult: 1 });
      for (const s of res.free) {
        setFree((f) => (f ? { ...f, left: f.left - 1, mult: s.spinMult } : f));
        await showSpin(s, bet, true);
        if (s.freeSpinsWon) {
          total += s.freeSpinsWon;
          setFree((f) => (f ? { ...f, left: f.left + s.freeSpinsWon, total } : f));
          setBanner(`+${s.freeSpinsWon} GIROS`);
          sfx.freeSpins();
          await sleep(900);
          setBanner(null);
        }
        if (cfg?.feature === "progressive_mult" && s.multiplier > s.scatter.mult) setFree((f) => (f ? { ...f, mult: s.spinMult + 1 } : f));
      }
      let fsWin = Math.floor(bet * res.free.reduce((a, s) => a + s.multiplier, 0));
      await sleep(400);
      if (res.duel) {
        // duelo na arena: revela as rodadas uma a uma
        setDuel({ rounds: res.duel.rounds, mult: res.duel.mult, shown: 0 });
        await sleep(900);
        for (let i = 1; i <= res.duel.rounds.length; i++) {
          setDuel((d) => (d ? { ...d, shown: i } : d));
          res.duel.rounds[i - 1] ? (sfx.win(), haptic.success()) : (sfx.lose(), haptic.error());
          await sleep(1100 * speedFactor());
        }
        await sleep(900);
        setDuel(null);
        fsWin = Math.floor(fsWin * res.duel.mult);
      }
      await new Promise<void>((resolve) => {
        summaryResolve.current = resolve;
        setSummary({ win: fsWin, spins: res.free.length, bet });
      });
      setFree(null);
      setSticky(new Set());
    }
    setHl(null);
    setLines([]);
    setLastRound(r.roundId);
    const finalGrid = res.free.length ? res.free[res.free.length - 1].final : res.base?.final;
    if (finalGrid) initial.current = finalGrid;
    if (bigWinTier(r.payout / bet) && r.payout > cost) await showBigWin(r.payout, r.payout / bet, res.free.length ? "Giros grátis" : undefined);
    else if (r.payout > 0) {
      coinBurst(document.getElementById("vs-reels"), r.payout / bet >= 3 ? 20 : 10);
      await sleep(600);
      revealBalance();
    } else revealBalance();
  }

  useEffect(() => {
    if (auto && !busy) {
      const t = setTimeout(() => play(false), 420 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [auto, busy]);
  // autoplay: intro e resumo dos giros grátis avançam sozinhos
  useEffect(() => {
    if (!intro || !auto) return;
    const t = setTimeout(() => {
      setIntro(null);
      introResolve.current();
    }, 3200);
    return () => clearTimeout(t);
  }, [intro, auto]);
  useEffect(() => {
    if (!summary) return;
    const t = setTimeout(() => {
      setSummary(null);
      summaryResolve.current();
    }, auto ? 3500 : 6000);
    return () => clearTimeout(t);
  }, [summary, auto]);

  const art = theme.art;
  return (
    <GameShell title={cfg?.name ?? id} game={id} className="bg-black" info={<Rules id={id} cfg={vcfg} bet={bet} />}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: theme.bg }} />
      <div className="relative flex-1 flex flex-col justify-center px-2">
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {free ? (
              <motion.div key="f" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl px-4 py-1.5 flex gap-4 items-center bg-black/45 border" style={{ borderColor: theme.accent + "66" }}>
                <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">GIROS</div><motion.div key={free.left} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display font-black text-2xl" style={{ color: theme.accent }}>{free.left}</motion.div></div>
                <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">BÔNUS</div><CountUp value={free.win} className="font-display font-black text-lg text-white" /></div>
                {cfg?.feature === "progressive_mult" && <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">MULT.</div><motion.div key={free.mult} initial={{ scale: 1.8 }} animate={{ scale: 1 }} className="font-display font-black text-2xl text-[#fde047]">x{free.mult}</motion.div></div>}
                {(cfg?.feature === "expanding_symbol" || cfg?.feature === "chosen_symbol") && specials.map((sp) => (
                  <div key={sp} className="w-10 h-10"><SymbolArt art={art[sp]} /></div>
                ))}
                {cfg?.feature === "trail" && cfg?.trail && (
                  <div className="text-center"><div className="text-[9px] font-black tracking-widest text-white/60">LABIRINTO</div><div className="font-display font-black text-lg" style={{ color: theme.accent }}>{trailPos}/{cfg.trail.length - 1}</div></div>
                )}
              </motion.div>
            ) : (
              <motion.div key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="font-display font-black text-[15px] bg-clip-text text-transparent" style={{ backgroundImage: theme.title }}>{theme.featureTitle}</div>
                <div className="text-[10.5px] font-bold text-white/55">20 linhas · até 50.000x</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div id="vs-reels" className="relative mx-auto w-full max-w-[460px] rounded-[26px] p-[2.5px]" style={{ background: theme.frame }}>
          <div className="relative rounded-[24px] p-2 aspect-[5/3.3]" style={{ background: theme.inner }}>
            <Reels
              ref={reels}
              theme={id}
              live={live}
              reels={5}
              rows={3}
              initial={initial.current}
              pool={pool}
              gap={5}
              aspect={1.08}
              highlight={hl}
              anticipationColor={theme.accent}
              cellClass={theme.cell}
              renderSymbol={(s, r, w) => (
                <SymbolArt art={art[s]}>
                  {s === 0 && wm?.[r]?.[w] ? (
                    <g>
                      <circle cx="78" cy="20" r="17" fill="#dc2626" stroke="#fff7ed" strokeWidth="2.5" />
                      <text x="78" y="26" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="15" fill="#fff">{wm[r][w]}x</text>
                    </g>
                  ) : null}
                  {s === 10 && (
                    <text x="50" y={money ? 66 : 60} textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize={money ? 20 : 26} fill="#fff" stroke="#1e1b4b" strokeWidth="3" paintOrder="stroke">
                      {orbs.get(`${r}-${w}`) ? (money ? fmtCompact(bet * orbs.get(`${r}-${w}`)!) : `${orbs.get(`${r}-${w}`)}x`) : money ? "$" : "?"}
                    </text>
                  )}
                </SymbolArt>
              )}
              cellOverlay={(r, w) => (
                <>
                  {sticky.has(`${r}-${w}`) && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: `inset 0 0 0 2.5px ${theme.accent}, 0 0 14px ${theme.accent}88` }}>
                      <span className="absolute top-0.5 right-1 text-[11px]">🔒</span>
                    </div>
                  )}
                  {walkers.has(`${r}-${w}`) && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: `inset 0 0 0 2.5px ${theme.accent}` }}>
                      <span className="absolute bottom-0.5 left-1 text-[13px] font-black" style={{ color: theme.accent }}>◀</span>
                    </div>
                  )}
                  {cm?.[r]?.[w] ? (
                    <motion.div initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 rounded-xl pointer-events-none grid place-items-start justify-end p-1" style={{ background: "linear-gradient(135deg, transparent 46%, rgba(255,255,255,0.85) 48%, rgba(255,255,255,0.85) 52%, transparent 54%)" }}>
                      <span className="rounded-full bg-red-600 text-white text-[11px] font-black px-1.5 shadow">{cm[r][w]}x</span>
                    </motion.div>
                  ) : null}
                </>
              )}
            >
              <Paylines lines={cfg?.lines ?? []} active={lines} reels={5} rows={3} colors={theme.lineColors} />
            </Reels>
            <AnimatePresence>
              {giant != null && (
                <motion.div key="giant" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", damping: 14 }} className="absolute top-2 bottom-2 left-[21%] right-[21%] rounded-2xl z-10 p-2 pointer-events-none" style={{ background: theme.inner, boxShadow: `0 0 0 3px ${theme.accent}, 0 0 30px ${theme.accent}88` }}>
                  <SymbolArt art={art[giant]} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {banner && (
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }} className="absolute inset-0 grid place-items-center pointer-events-none z-20">
                  <div className="bg-black/70 rounded-2xl px-5 py-2.5 border border-white/10">
                    <div className="font-display font-black text-2xl bg-clip-text text-transparent" style={{ backgroundImage: theme.title }}>{banner}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="h-14 flex items-center justify-center">
          {win > 0 && (
            <div className="flex items-center gap-2">
              <ChipIcon size={22} />
              <CountUp value={win} className="font-display font-black text-2xl text-white" onTick={sfx.count} />
              <span className="text-xs font-black" style={{ color: theme.accent }}>{fmtMult(win / bet)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="relative px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        {variants && (
          <VariantPicker id={id} feature={cfg.feature} variants={variants} value={curVariant!} onChange={setVariant} disabled={busy} />
        )}
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-[84px]" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse={!busy} onClick={() => play(false)}>{busy ? "PARAR" : "GIRAR"}</Btn>
          <Btn variant="violet" size="lg" className="w-[110px] text-[11px] leading-tight" disabled={busy} onClick={() => play(true)}>
            <span>COMPRAR<br />BÔNUS {vcfg?.buyPrice ?? ""}x</span>
          </Btn>
        </div>
        {lastRound && !busy && win > 0 && <button onClick={() => shareRound(lastRound)} className="text-[11px] font-black press" style={{ color: theme.accent }}>COMPARTILHAR NO GRUPO ↗</button>}
      </div>

      <AnimatePresence>
        {intro && (
          <FsIntro
            id={id}
            spins={intro.spins}
            special={intro.special}
            specials={intro.specials}
            onStart={() => {
              setIntro(null);
              introResolve.current();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {duel && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto"><SymbolArt art={theme.art[0]} /></div>
              <div className="font-display font-black text-3xl mt-2 bg-clip-text text-transparent" style={{ backgroundImage: theme.title }}>DUELO NA ARENA</div>
              <div className="text-sm text-white/60 font-bold mt-1">Cada vitória soma +1 ao multiplicador do bônus</div>
              <div className="flex justify-center gap-3 mt-6">
                {Array.from({ length: 4 }).map((_, i) => {
                  const shown = i < duel.shown;
                  const res = duel.rounds[i];
                  return (
                    <motion.div key={i} animate={shown ? { rotateY: [90, 0], scale: [1.3, 1] } : {}} className={cls("w-14 h-16 rounded-xl grid place-items-center text-2xl font-black border-2", !shown ? "border-white/20 bg-white/5 text-white/30" : res ? "border-win-400 bg-win-500/25" : res === false ? "border-loss-400 bg-loss-500/25" : "border-white/10 bg-white/5 text-white/20")}>
                      {!shown ? "⚔" : res ? "🏆" : res === false ? "✖" : "—"}
                    </motion.div>
                  );
                })}
              </div>
              <motion.div key={duel.shown} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="font-display font-black text-5xl mt-6" style={{ color: theme.accent }}>
                x{1 + duel.rounds.slice(0, duel.shown).filter(Boolean).length}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {summary && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSummary(null); summaryResolve.current(); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-6 w-full max-w-sm text-center border" style={{ background: theme.inner, borderColor: theme.accent + "88" }}>
              <div className="text-xs font-black tracking-[0.3em] text-white/60">BÔNUS ENCERRADO</div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <ChipIcon size={30} />
                <CountUp value={summary.win} duration={1.4} className="font-display font-black text-4xl text-white" />
              </div>
              <div className="font-extrabold" style={{ color: theme.accent }}>{fmtMult(summary.win / summary.bet)} · {summary.spins} giros</div>
              <div className="text-[11px] text-white/45 mt-4">Toque para continuar</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}

function FsIntro({ id, spins, special, specials, onStart }: { id: string; spins: number; special: number; specials?: number[]; onStart: () => void }) {
  const theme = SLOT_THEMES[id];
  const book = special >= 2;
  const second = specials && specials.length > 1 ? specials[1] : null;
  const [shown, setShown] = useState(book ? 2 : -1);
  const [revealed, setRevealed] = useState(!book);
  useEffect(() => {
    if (!book) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(2 + (i % 8));
      sfx.tick();
      if (i > 18 && 2 + (i % 8) === special) {
        clearInterval(t);
        setRevealed(true);
        sfx.jackpot();
        haptic.impact("heavy");
      }
    }, 90);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/85 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-center">
        <div className="w-28 h-28 mx-auto"><SymbolArt art={theme.art[1]} /></div>
        <div className="font-display font-black text-6xl mt-2 bg-clip-text text-transparent" style={{ backgroundImage: theme.title }}>{spins}</div>
        <div className="font-display font-black text-2xl">GIROS GRÁTIS</div>
        {book && (
          <div className="mt-4">
            <div className="text-xs font-black tracking-widest text-white/60">{second != null ? "SÍMBOLOS ESPECIAIS" : "SÍMBOLO ESPECIAL"}</div>
            <div className="flex justify-center gap-3">
              <motion.div key={shown} initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className={cls("w-24 h-24 mt-2 rounded-2xl p-2 border-2", revealed ? "shadow-[0_0_30px_rgba(250,204,21,0.8)]" : "")} style={{ borderColor: theme.accent, background: theme.inner }}>
                <SymbolArt art={theme.art[shown]} />
              </motion.div>
              {second != null && revealed && (
                <motion.div initial={{ rotateY: 90, scale: 0.6 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 mt-2 rounded-2xl p-2 border-2 shadow-[0_0_30px_rgba(250,204,21,0.8)]" style={{ borderColor: theme.accent, background: theme.inner }}>
                  <SymbolArt art={theme.art[second]} />
                </motion.div>
              )}
            </div>
          </div>
        )}
        <p className="text-sm text-white/70 mt-4 max-w-xs mx-auto">{theme.featureDesc}</p>
        <Btn variant="gold" size="xl" className="mt-6 w-60" pulse disabled={!revealed} onClick={onStart}>COMEÇAR</Btn>
      </motion.div>
    </motion.div>
  );
}

function Rules({ id, cfg, bet }: { id: string; cfg: any; bet: number }) {
  const theme = SLOT_THEMES[id];
  if (!cfg) return null;
  const lb = bet / 20;
  return (
    <>
      <p><b>{theme.featureTitle}.</b> {theme.featureDesc}</p>
      <p>5 rolos, 3 linhas, 20 linhas fixas, pagando da esquerda para a direita. Valores para a aposta atual:</p>
      <div className="grid grid-cols-2 gap-2">
        {[2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
          <div key={s} className="glass rounded-xl p-2 flex items-center gap-2">
            <div className="w-11 h-11 shrink-0"><SymbolArt art={theme.art[s]} /></div>
            <div className="text-[11px] leading-tight">
              <div className="font-bold">{cfg.symbols[s]}</div>
              {[5, 4, 3].map((n) => <div key={n}>{n}× <b className="text-gold-300">{fmt(cfg.pays[s][n - 3] * lb)}</b></div>)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 items-center"><div className="w-12 h-12 shrink-0"><SymbolArt art={theme.art[0]} /></div><div><b>{cfg.symbols[0]}</b>: substitui os símbolos comuns.{cfg.feature === "expanding_symbol" || cfg.feature === "chosen_symbol" ? " Também é Scatter." : ""}</div></div>
      <div className="flex gap-3 items-center"><div className="w-12 h-12 shrink-0"><SymbolArt art={theme.art[1]} /></div><div><b>{cfg.symbols[1]}</b>: 3, 4 ou 5 pagam 2x, 10x ou 50x a aposta e dão {cfg.freeSpins[3]}, {cfg.freeSpins[4]} ou {cfg.freeSpins[5]} giros grátis (+5 ao repetir no bônus).</div></div>
      {cfg.feature === "mult_orbs" && <div className="flex gap-3 items-center"><div className="w-12 h-12 shrink-0"><SymbolArt art={theme.art[10]} /></div><div><b>{cfg.symbols[10] ?? "Orbe"}</b>: 2x a 100x; somam e multiplicam o ganho do giro.</div></div>}
      {cfg.feature === "money_collect" && <div className="flex gap-3 items-center"><div className="w-12 h-12 shrink-0"><SymbolArt art={theme.art[10]} /></div><div><b>{cfg.symbols[10]}</b>: traz um valor em fichas. Só paga quando um {cfg.symbols[0].replace(" (Wild)", "")} aparece no mesmo giro e coleta todos os valores.</div></div>}
      {cfg.feature === "trail" && cfg.trail && <div><b>Prêmios do labirinto</b> (x aposta): {cfg.trail.slice(1).map((v: number) => fmtMult(v)).join(" · ")}</div>}
      {cfg.variants && <p>Cada escolha tem a própria tabela calibrada para o mesmo retorno de ≈ 96%.</p>}
      <p><b>Comprar bônus</b>: {cfg.buyPrice}x a aposta para ir direto aos giros grátis.</p>
      <p className="text-white/50 text-xs">RTP ≈ 96% (calibrado por simulação). Prêmio máximo 50.000x. Resultado gerado no servidor (provably fair).</p>
    </>
  );
}

function VariantPicker({ id, feature, variants, value, onChange, disabled }: { id: string; feature: string; variants: string[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const theme = SLOT_THEMES[id];
  if (feature === "dual_mode")
    return (
      <div className={cls("grid grid-cols-2 gap-2", disabled && "opacity-50 pointer-events-none")}>
        {variants.map((v) => (
          <button key={v} onClick={() => { haptic.tap(); sfx.click(); onChange(v); }} className={cls("press rounded-2xl py-1.5 border-2 font-black text-sm", value === v ? "text-white" : "border-white/10 text-white/50 bg-white/5")} style={value === v ? { borderColor: v === "fogo" ? "#f97316" : "#38bdf8", background: v === "fogo" ? "#7c2d1288" : "#0c4a6e88" } : undefined}>
            {v === "fogo" ? "🔥 FOGO · wilds 2x-10x" : "❄️ GELO · wilds presos"}
          </button>
        ))}
      </div>
    );
  return (
    <div className={cls("glass rounded-2xl p-1.5 flex items-center gap-1.5", disabled && "opacity-50 pointer-events-none")}>
      <span className="text-[9px] font-black text-white/50 leading-tight w-12 text-center">RELÍQUIA</span>
      <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
        {variants.map((v) => (
          <button key={v} onClick={() => { haptic.tap(); sfx.click(); onChange(v); }} className={cls("press shrink-0 w-10 h-10 rounded-xl p-0.5 border-2", value === v ? "" : "border-transparent opacity-60")} style={value === v ? { borderColor: theme.accent, background: theme.inner } : undefined}>
            <SymbolArt art={theme.art[Number(v)]} />
          </button>
        ))}
      </div>
    </div>
  );
}
