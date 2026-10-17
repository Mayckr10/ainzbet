import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { COSMIC_ART, COSMIC_NAMES } from "../art/cosmic";
import { SymbolArt } from "../art/Symbol";
import { api } from "../lib/api";
import { cls, fmt, fmtMult, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { refreshUser, revealBalance, setBalance, showDebit, speedFactor, updateSettings, useApp } from "../lib/store";
import { haptic, onBackButton } from "../lib/tg";
import { nav } from "../nav";
import { celebrate, coinBurst, confetti, showBigWin, bigWinTier } from "../ui/effects";
import { errorMessage, shareRound } from "../ui/GameShell";
import { BalancePill, Btn, ChipIcon, CountUp, Sheet, toast } from "../ui/kit";
import { Paylines, Reels, type ReelsHandle } from "../ui/Reels";

const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
];
const POOL = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 8, 9, 10, 0, 1, 3];
const BETS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];
const ARCANE_TEXT: Record<number, { name: string; text: string; color: string }> = {
  12: { name: "SOL", text: "Coluna inteira vira Portal!", color: "#fbbf24" },
  13: { name: "LUA", text: "Multiplicador guardado para a próxima vitória", color: "#a5b4fc" },
  14: { name: "COMETA", text: "Portais caem na grade!", color: "#67e8f9" },
  15: { name: "ECLIPSE", text: "Re-Spin dos rolos sem vitória", color: "#f59e0b" },
};

type Machine = {
  queenMult: number;
  nextWilds: number;
  free: null | { left: number; total: number; played: number; win: number; best: number; bet: number };
  bonus: null | { picks: number[]; revealed: { index: number; prize: Prize }[]; bet: number };
};
type Prize = { kind: "credits" | "mult" | "spins" | "wilds"; value: number } | { kind: "joker" };

function randomGrid() {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => POOL[(Math.random() * 12) | 0]));
}

export default function Cosmic() {
  const [intro, setIntro] = useState(() => !sessionStorage.getItem("cosmic_seen"));
  return intro ? <Intro onPlay={() => { sessionStorage.setItem("cosmic_seen", "1"); setIntro(false); }} /> : <Machine />;
}

/* ===================================================================== tela inicial */
function Intro({ onPlay }: { onPlay: () => void }) {
  const [how, setHow] = useState(false);
  useEffect(() => onBackButton(() => nav.back()), []);
  return (
    <div className="fixed inset-0 nebula-bg flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      <div className="stars-layer" />
      <motion.div className="absolute w-[620px] h-[620px] rounded-full opacity-40 spin-slow" style={{ background: "conic-gradient(from 0deg, transparent, #7c3aed55, transparent 30%, #22d3ee44, transparent 60%, #f472b655, transparent)" }} />
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }} className="relative w-40 h-40 mb-4">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
          <SymbolArt art={COSMIC_ART[11]} />
        </motion.div>
      </motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative font-display font-black text-[40px] leading-[0.95] gold-text">
        ORÁCULO<br />CÓSMICO
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative mt-3 text-white/70 text-sm max-w-xs">
        Arcanos celestes, giros grátis com ganhos em dobro e prêmios de até <b className="text-gold-300">50.000x</b>.
      </motion.p>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="relative mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Btn variant="gold" size="xl" pulse onClick={onPlay} className="shine">JOGAR AGORA</Btn>
        <Btn variant="glass" size="lg" onClick={() => setHow(true)}>Como jogar</Btn>
      </motion.div>
      <p className="absolute text-[11px] text-white/35 px-6" style={{ bottom: "calc(var(--safe-bottom) + 16px)" }}>Jogo de entretenimento. Fichas virtuais sem valor monetário.</p>
      <Sheet open={how} onClose={() => setHow(false)} title="Como jogar">
        <Rules />
      </Sheet>
    </div>
  );
}

/* ===================================================================== máquina */
function Machine() {
  const reels = useRef<ReelsHandle>(null);
  const cfg = useApp((s) => s.config);
  const settings = useApp((s) => s.settings);
  const user = useApp((s) => s.user);
  const displayBalance = useApp((s) => s.displayBalance);
  const [bet, setBetState] = useState(() => Number(localStorage.getItem("cc_bet_cosmic")) || 100);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [winShow, setWinShow] = useState<{ amount: number; mult: number; parts: string[] } | null>(null);
  const [highlight, setHighlight] = useState<Set<string> | null>(null);
  const [lines, setLines] = useState<number[]>([]);
  const [golden, setGolden] = useState<Set<string>>(new Set());
  const [chips, setChips] = useState<Map<string, number>>(new Map());
  const [banner, setBanner] = useState<{ title: string; text: string; color: string } | null>(null);
  const [auto, setAuto] = useState(0);
  const [autoMenu, setAutoMenu] = useState(false);
  const [paytable, setPaytable] = useState(false);
  const [freeIntro, setFreeIntro] = useState<number | null>(null);
  const [freeSummary, setFreeSummary] = useState<{ win: number; played: number; best: number; bet: number } | null>(null);
  const [lastRound, setLastRound] = useState<number | null>(null);
  const autoRef = useRef(0);
  const busyRef = useRef(false);
  const [cycle, setCycle] = useState<{ line: number; win: number; cells: [number, number][] }[] | null>(null);
  const [focus, setFocus] = useState(0);
  const initial = useRef(randomGrid());
  autoRef.current = auto;

  const inFree = !!machine?.free && machine.free.left > 0;
  const setBet = (v: number) => {
    setBetState(v);
    localStorage.setItem("cc_bet_cosmic", String(v));
  };

  useEffect(() => onBackButton(() => nav.back()), []);
  useEffect(() => {
    api.get<{ machine: Machine }>("/cosmic/state").then((r) => setMachine(r.machine)).catch(() => {});
  }, []);

  const clearFx = () => {
    setHighlight(null);
    setLines([]);
    setGolden(new Set());
    setChips(new Map());
    setWinShow(null);
    setCycle(null);
    setFocus(0);
  };

  async function resync() {
    try {
      await refreshUser();
      const st = await api.get<{ machine: Machine }>("/cosmic/state");
      setMachine(st.machine);
    } catch {}
  }

  /** Giro com proteção total: qualquer erro ou travamento devolve a máquina a um estado jogável. */
  async function spin() {
    if (busyRef.current) {
      // tocar durante o giro = parada rápida
      reels.current?.hurry();
      return;
    }
    if (machine?.bonus) return;
    busyRef.current = true;
    const watchdog = setTimeout(() => {
      reels.current?.reset(initial.current);
      setBanner(null);
      setGolden(new Set());
      revealBalance();
      busyRef.current = false;
      setBusy(false);
      resync();
    }, 45_000);
    try {
      await runSpin();
    } catch (e) {
      toast(errorMessage(e), "error");
      reels.current?.reset(initial.current);
      setBanner(null);
      setGolden(new Set());
      setAuto(0);
      revealBalance();
      resync();
    } finally {
      clearTimeout(watchdog);
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function runSpin() {
    const free = inFree;
    const stake = free ? machine!.free!.bet : bet;
    if (!free && (user?.balance ?? 0) < stake) {
      toast("Saldo insuficiente", "error");
      setAuto(0);
      nav.push({ name: "store" });
      return;
    }
    setBusy(true);
    clearFx();
    haptic.impact("medium");
    if (!free) showDebit(stake);
    reels.current?.start();
    const r: any = await api.post("/cosmic/spin", { bet: stake });
    setBalance(r.balance, false);
    const res = r.result;
    const sf = speedFactor();

    // antecipação: 2 nebulosas ou 2 orbes já visíveis antes dos últimos rolos
    const anticipate: number[] = [];
    let sc = 0;
    let bo = 0;
    for (let reel = 0; reel < 5; reel++) {
      if ((sc >= 2 || bo >= 2) && reel >= 2) anticipate.push(reel);
      if (res.initial[reel].includes(1)) sc++;
      if (res.initial[reel].includes(2)) bo++;
    }
    await reels.current?.stop(res.initial, { anticipate });
    initial.current = res.initial;
    if (res.scatters.length >= 3 || res.bonusSymbols.length >= 3) {
      sfx.scatter();
      setHighlight(new Set([...res.scatters, ...res.bonusSymbols].map(([a, b]: number[]) => `${a}-${b}`)));
      await sleep(900 * sf);
      setHighlight(null);
    }

    // arcanos dourados
    if (res.golden.length) {
      setGolden(new Set(res.golden.map(([a, b]: number[]) => `${a}-${b}`)));
      sfx.arcane();
      haptic.impact("heavy");
      await sleep(700 * sf);
      const kinds = [...new Set(res.golden.map(([a, b]: number[]) => res.initial[a][b] as number))].filter((k) => ARCANE_TEXT[k as number]) as number[];
      for (const k of kinds) {
        const a = ARCANE_TEXT[k];
        setBanner({ title: a.name, text: k === 13 && res.effects.queen ? `Próxima vitória x${res.effects.queen}` : a.text, color: a.color });
        await sleep(1100 * sf);
      }
      setBanner(null);
    }
    // aplica transformações na ordem do motor
    const g: number[][] = res.initial.map((c: number[]) => c.slice());
    const wild = (a: number, b: number) => {
      if (g[a][b] !== 1 && g[a][b] !== 2) g[a][b] = 0;
    };
    if (res.effects.bonusWilds.length || res.effects.royal.length || res.effects.jackWilds.length) {
      for (const [a, b] of res.effects.bonusWilds) g[a][b] = 0;
      for (const col of res.effects.royal) for (let b = 0; b < 3; b++) wild(col, b);
      for (const [a, b] of res.effects.jackWilds) g[a][b] = 0;
      sfx.gem();
      reels.current?.setGrid(g.map((c) => c.slice()));
      await sleep(650 * sf);
    }
    if (res.effects.respin) {
      setGolden(new Set());
      setBanner({ title: "RE-SPIN", text: "Os rolos sem vitória giram de novo", color: "#f59e0b" });
      await sleep(800 * sf);
      setBanner(null);
      const others = [0, 1, 2, 3, 4].filter((x) => !res.effects.respin.held.includes(x));
      if (others.length) {
        // gira e para EXATAMENTE os mesmos rolos (antes os rolos segurados ficavam girando)
        reels.current?.start(others);
        await reels.current?.stop(res.effects.respin.grid, { only: others });
      }
    }
    reels.current?.setGrid(res.grid);
    setGolden(new Set());

    if (res.multChips.length && res.lineWin > 0) {
      setChips(new Map(res.multChips.map((c: any) => [`${c.cell[0]}-${c.cell[1]}`, c.value])));
      sfx.pop();
    }

    // vitória
    const payout = r.payout as number;
    if (payout > 0) {
      const cells = new Set<string>();
      for (const w of res.wins) for (const [a, b] of w.cells) cells.add(`${a}-${b}`);
      for (const c of res.multChips) cells.add(`${c.cell[0]}-${c.cell[1]}`);
      setHighlight(cells);
      setLines(res.wins.map((w: any) => w.line));
      const parts: string[] = [];
      if (res.multipliers.free > 1) parts.push(`Giros grátis x${res.multipliers.free}`);
      if (res.multipliers.chips > 1) parts.push(`Orbes x${res.multipliers.chips}`);
      if (res.multipliers.queen > 1) parts.push(`Lua x${res.multipliers.queen}`);
      setWinShow({ amount: payout, mult: payout / stake, parts });
      setLastWin(payout);
      setLastRound(r.roundId);
      const tier = bigWinTier(payout / stake);
      if (tier) {
        await sleep(500 * sf);
        await showBigWin(payout, payout / stake);
      } else {
        sfx.win(payout / stake >= 5);
        haptic.success();
        coinBurst(document.getElementById("cosmic-reels"), payout / stake >= 3 ? 20 : 10);
        await sleep(650);
        revealBalance();
        await sleep((res.wins.length > 3 ? 900 : 600) * sf);
      }
      if (res.wins.length > 1) setCycle(res.wins.map((w: any) => ({ line: w.line, win: Math.floor(w.win * stake * res.multipliers.free * res.multipliers.chips * res.multipliers.queen), cells: w.cells })));
    } else {
      revealBalance();
      if (!free) setLastWin(0);
    }

    const m = r.machine as Machine;
    // fim dos giros grátis
    if (res.isFree && res.free && res.free.left === 0 && !m.free) {
      await sleep(400);
      setMachine(m);
      setFreeSummary({ win: res.free.win, played: res.free.played, best: res.free.best, bet: res.free.bet });
      return;
    }
    // ganhou giros grátis
    if (res.freeSpinsWon && !res.isFree) {
      setMachine(m);
      sfx.freeSpins();
      confetti();
      setFreeIntro(res.freeSpinsWon);
      return;
    }
    if (res.freeSpinsWon && res.isFree) {
      setBanner({ title: `+${res.freeSpinsWon} GIROS`, text: "Nebulosas reacenderam o bônus!", color: "#f472b6" });
      sfx.freeSpins();
      await sleep(1300 * sf);
      setBanner(null);
    }
    setMachine(m);
  }

  // giros automáticos e giros grátis em sequência
  useEffect(() => {
    if (busy || freeIntro || freeSummary || machine?.bonus) return;
    if (inFree) {
      const t = setTimeout(spin, 450 * speedFactor());
      return () => clearTimeout(t);
    }
    if (auto > 0) {
      const t = setTimeout(() => {
        setAuto((a) => Math.max(0, a - 1));
        spin();
      }, 350 * speedFactor());
      return () => clearTimeout(t);
    }
  }, [busy, auto, inFree, freeIntro, freeSummary, machine?.bonus]);

  // depois de uma vitória com várias linhas, mostra uma linha de cada vez (como nas máquinas reais)
  useEffect(() => {
    if (busy || !cycle || cycle.length < 2) return;
    const t = setInterval(() => setFocus((f) => (f + 1) % cycle.length), 1300);
    return () => clearInterval(t);
  }, [busy, cycle]);
  const focused = !busy && cycle && cycle.length > 1 ? cycle[focus % cycle.length] : null;

  const changeBet = (dir: 1 | -1) => {
    const i = BETS.findIndex((b) => b >= bet);
    const next = BETS[Math.max(0, Math.min(BETS.length - 1, (i < 0 ? BETS.length - 1 : i) + dir))];
    setBet(next);
    sfx.chip();
    haptic.tap();
  };
  const maxBet = () => {
    const bal = user?.balance ?? 0;
    const cap = Math.min(user?.limits.maxBet ?? 100000, bal);
    const best = [...BETS].reverse().find((b) => b <= cap) ?? BETS[0];
    setBet(best);
    sfx.chip();
  };

  const themeFree = inFree || !!freeIntro;

  return (
    <div className={cls("fixed inset-0 flex flex-col overflow-hidden transition-colors duration-700", themeFree ? "bg-[#140b02]" : "nebula-bg")}>
      <div className="stars-layer" />
      {themeFree && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(70% 50% at 50% 0%, rgba(245,196,81,0.28), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(185,125,18,0.25), transparent 70%)" }} />}

      {/* topo */}
      <header className="relative z-10 flex items-center gap-2 px-3" style={{ paddingTop: "calc(var(--safe-top) + 10px)" }}>
        <div className="flex-1">
          <div className="font-display font-black text-[15px] gold-text leading-none">ORÁCULO CÓSMICO</div>
          <div className="text-[10px] text-white/45 font-bold mt-1">20 linhas · até 50.000x</div>
        </div>
        <BalancePill onClick={() => nav.push({ name: "store" })} />
      </header>

      {/* status: giros grátis / lua / portais guardados */}
      <div className="relative z-10 h-[64px] flex items-center justify-center gap-2 px-3">
        <AnimatePresence mode="popLayout">
          {inFree && machine?.free ? (
            <motion.div key="free" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="gold-border rounded-2xl px-4 py-1.5 flex items-center gap-4">
              <div className="text-center">
                <div className="text-[9px] font-black tracking-widest text-gold-300/80">GIROS RESTANTES</div>
                <motion.div key={machine.free.left} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="font-display font-black text-2xl gold-text leading-none">{machine.free.left}</motion.div>
              </div>
              <div className="w-px h-8 bg-gold-400/30" />
              <div className="text-center">
                <div className="text-[9px] font-black tracking-widest text-gold-300/80">TOTAL DO BÔNUS</div>
                <CountUp value={Math.floor(machine.free.win * machine.free.bet)} className="font-display font-black text-xl text-white leading-none" />
              </div>
              <div className="rounded-lg bg-gold-400 text-[#3b2300] text-[11px] font-black px-1.5 py-0.5">x2</div>
            </motion.div>
          ) : (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
              {machine?.queenMult ? (
                <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-extrabold text-indigo-200">
                  <span className="w-5 h-5"><SymbolArt art={COSMIC_ART[13]} /></span> Próxima vitória x{machine.queenMult}
                </div>
              ) : null}
              {machine?.nextWilds ? (
                <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-extrabold text-violet-200">
                  <span className="w-5 h-5"><SymbolArt art={COSMIC_ART[0]} /></span> +{machine.nextWilds} Portais no próximo giro
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* rolos */}
      <div className="relative z-0 flex-1 min-h-0 px-2 flex flex-col justify-center">
        <div className="relative mx-auto w-full max-w-[460px] flex items-end justify-center gap-3 mb-2">
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="w-14 h-14 shrink-0 drop-shadow-[0_0_16px_rgba(167,139,250,0.7)]">
            <SymbolArt art={COSMIC_ART[11]} />
          </motion.div>
          <div className={cls("rounded-2xl px-4 py-1.5 text-center", themeFree ? "gold-border" : "bg-black/40 border border-gold-400/30")}>
            <div className="text-[9px] font-black tracking-[0.25em] text-gold-300/80">PRÊMIO MÁXIMO</div>
            <div className="font-display font-black text-xl gold-text leading-tight tabular">{fmt((inFree ? machine!.free!.bet : bet) * 50000)}</div>
          </div>
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1.5 }} className="w-14 h-14 shrink-0 drop-shadow-[0_0_16px_rgba(34,211,238,0.6)]">
            <SymbolArt art={COSMIC_ART[15]} />
          </motion.div>
        </div>
        <div id="cosmic-reels" className={cls("relative mx-auto w-full max-w-[460px] rounded-[26px] p-2.5", themeFree ? "gold-border" : "")} style={!themeFree ? { background: "linear-gradient(180deg, rgba(124,58,237,0.35), rgba(34,211,238,0.18))", padding: 2 } : undefined}>
          <div className={cls("relative rounded-[22px] p-2 aspect-[5/3.5]", themeFree ? "bg-[#1d1206]" : "bg-space-900/90")}>
            <Reels
              ref={reels}
              theme="cosmic"
              live={[3]}
              reels={5}
              rows={3}
              initial={initial.current}
              pool={POOL}
              gap={5}
              aspect={1.12}
              cellClass="rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.015]"
              highlight={focused ? new Set(focused.cells.map(([a, b]) => `${a}-${b}`)) : highlight}
              renderSymbol={(s, r, w) => (
                <SymbolArt art={COSMIC_ART[s]}>
                  {s === 3 && (
                    <text x="50" y="60" textAnchor="middle" fontFamily="Unbounded" fontWeight="900" fontSize="26" fill="#fff" stroke="#083344" strokeWidth="3" paintOrder="stroke">
                      {chips.get(`${r}-${w}`) ? `x${chips.get(`${r}-${w}`)}` : "x?"}
                    </text>
                  )}
                </SymbolArt>
              )}
              cellOverlay={(r, w) =>
                golden.has(`${r}-${w}`) ? (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.45 }}
                    style={{ boxShadow: "inset 0 0 0 3px #fde047, 0 0 22px rgba(253,224,71,0.8)", background: "radial-gradient(circle, rgba(253,224,71,0.35), transparent 70%)" }}
                  />
                ) : null
              }
            >
              <Paylines lines={LINES} active={lines} reels={5} rows={3} focus={focused ? focused.line : null} />
            </Reels>
            <AnimatePresence>
              {banner && (
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="absolute inset-0 grid place-items-center pointer-events-none"
                >
                  <div className="bg-black/70 rounded-2xl px-5 py-3 text-center border border-white/10" style={{ boxShadow: `0 0 40px ${banner.color}66` }}>
                    <div className="font-display font-black text-3xl" style={{ color: banner.color, textShadow: `0 0 20px ${banner.color}` }}>{banner.title}</div>
                    <div className="text-xs font-bold text-white/80 mt-1">{banner.text}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ganho */}
        <div className="h-[58px] flex items-center justify-center">
          <AnimatePresence>
            {winShow && (
              <motion.div initial={{ y: 10, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <ChipIcon size={22} />
                  <CountUp value={winShow.amount} duration={0.9} onTick={sfx.count} className="font-display font-black text-[26px] gold-text" />
                  <span className="text-xs font-extrabold text-gold-300/80 ml-1">{fmtMult(winShow.mult)}</span>
                </div>
                {focused ? (
                  <div className="text-[11px] font-extrabold text-gold-300/90">Linha {focused.line + 1} · +{fmt(focused.win)}</div>
                ) : (
                  winShow.parts.length > 0 && <div className="text-[10px] font-bold text-white/60">{winShow.parts.join(" · ")}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* painel */}
      <footer className="relative z-10 px-3 pt-1" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="grid grid-cols-3 gap-2 mb-2 text-center">
          <Stat label="SALDO"><CountUp value={displayBalance} /></Stat>
          <Stat label="APOSTA">{fmt(inFree ? machine!.free!.bet : bet)}</Stat>
          <Stat label="ÚLTIMO GANHO" accent={lastWin > 0}>{fmt(lastWin)}</Stat>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-2">
            <RoundBtn onClick={() => setPaytable(true)} label="ⓘ" title="Pagamentos" />
            <RoundBtn onClick={() => updateSettings({ sound: !settings.sound })} label={settings.sound ? "🔊" : "🔈"} title="Som" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <RoundBtn big onClick={() => changeBet(-1)} label="−" disabled={busy || inFree} />
            <motion.button
              data-spin
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (auto) return setAuto(0);
                sfx.click();
                spin();
              }}
              className={cls("relative w-[92px] h-[92px] rounded-full grid place-items-center", !busy && !inFree && "pulse-glow")}
              style={{ background: inFree ? "conic-gradient(#fde047, #f59e0b, #fde047)" : "conic-gradient(from 0deg, #fde047, #f472b6, #8b5cf6, #22d3ee, #fde047)", padding: 4 }}
            >
              <div className={cls("w-full h-full rounded-full grid place-items-center", inFree ? "bg-[#3b2300]" : "bg-space-900")}>
                {auto ? (
                  <div className="text-center leading-none">
                    <div className="font-display font-black text-xl">{auto}</div>
                    <div className="text-[9px] font-black text-white/60 mt-1">PARAR</div>
                  </div>
                ) : inFree ? (
                  <div className="font-display font-black text-sm gold-text">GRÁTIS</div>
                ) : (
                  <motion.svg animate={busy ? { rotate: 360 } : { rotate: 0 }} transition={busy ? { repeat: Infinity, duration: 0.6, ease: "linear" } : {}} width="40" height="40" viewBox="0 0 24 24">
                    <path d="M12 4a8 8 0 1 1-7.4 5" fill="none" stroke="url(#a-gold)" strokeWidth="2.6" strokeLinecap="round" />
                    <path d="M3 4.5l1.6 4.6 4.6-1.4" fill="none" stroke="url(#a-gold)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </div>
            </motion.button>
            <RoundBtn big onClick={() => changeBet(1)} label="+" disabled={busy || inFree} />
          </div>
          <div className="flex flex-col gap-2">
            <RoundBtn onClick={() => setAutoMenu(true)} label="AUTO" title="Giro automático" small disabled={inFree} />
            <RoundBtn onClick={maxBet} label="MAX" title="Aposta máxima" small disabled={busy || inFree} />
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-2">
          {(["normal", "fast", "turbo"] as const).map((s) => (
            <button key={s} onClick={() => updateSettings({ speed: s })} className={cls("text-[10px] font-black tracking-wider px-2 py-1 rounded-lg press", settings.speed === s ? "bg-white/15 text-white" : "text-white/40")}>
              {s === "normal" ? "NORMAL" : s === "fast" ? "RÁPIDO" : "TURBO ⚡"}
            </button>
          ))}
          {lastRound && lastWin > 0 && !busy && (
            <button onClick={() => shareRound(lastRound)} className="text-[10px] font-black tracking-wider px-2 py-1 rounded-lg press text-plasma-400">COMPARTILHAR ↗</button>
          )}
        </div>
      </footer>

      {/* menus */}
      <Sheet open={autoMenu} onClose={() => setAutoMenu(false)} title="Giro automático">
        <div className="grid grid-cols-3 gap-2 pb-4">
          {[10, 25, 50, 100, 250, 500].map((n) => (
            <Btn key={n} variant="violet" onClick={() => { setAuto(n); setAutoMenu(false); }}>{n}</Btn>
          ))}
        </div>
        <p className="text-xs text-white/50 pb-4">O automático para sozinho ao entrar em bônus ou se o saldo acabar. Toque no botão central para parar a qualquer momento.</p>
      </Sheet>
      <Sheet open={paytable} onClose={() => setPaytable(false)} title="Pagamentos" tall>
        <Paytable bet={bet} pays={cfg?.cosmic?.pays} />
      </Sheet>

      <FreeIntro n={freeIntro} autoStart={auto > 0} onStart={() => setFreeIntro(null)} />
      <FreeSummary data={freeSummary} autoClose={auto > 0} onClose={() => setFreeSummary(null)} />
      {machine?.bonus && <PickBonus machine={machine} onDone={(m) => setMachine(m)} />}
    </div>
  );
}

function Stat({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl py-1.5 bg-white/[0.06] border border-white/10">
      <div className="text-[9px] font-black tracking-widest text-white/40">{label}</div>
      <div className={cls("font-extrabold text-sm tabular", accent ? "text-win-400" : "text-white")}>{children}</div>
    </div>
  );
}

function RoundBtn({ label, onClick, big, small, disabled, title }: { label: string; onClick: () => void; big?: boolean; small?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={() => {
        haptic.tap();
        sfx.click();
        onClick();
      }}
      className={cls("press glass rounded-full grid place-items-center font-black", big ? "w-14 h-14 text-2xl" : "w-12 h-12 text-base", small && "text-[10px] tracking-wider")}
    >
      {label}
    </button>
  );
}

/* ===================================================================== giros grátis */
function FreeIntro({ n, onStart, autoStart }: { n: number | null; onStart: () => void; autoStart?: boolean }) {
  useEffect(() => {
    if (!n || !autoStart) return;
    const t = setTimeout(onStart, 2600);
    return () => clearTimeout(t);
  }, [n, autoStart]);
  return (
    <AnimatePresence>
      {n && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }} className="text-center">
            <div className="w-28 h-28 mx-auto"><SymbolArt art={COSMIC_ART[1]} /></div>
            <div className="font-display font-black text-6xl gold-text mt-2">{n}</div>
            <div className="font-display font-black text-2xl text-white">GIROS GRÁTIS</div>
            <ul className="mt-4 text-sm text-gold-300/90 font-bold space-y-1">
              <li>✦ Todos os ganhos x2</li>
              <li>✦ Arcanos dourados com mais frequência</li>
              <li>✦ 3 Nebulosas = +5 giros</li>
            </ul>
            <Btn variant="gold" size="xl" pulse className="mt-8 w-64 shine" onClick={onStart}>{autoStart ? "COMEÇANDO…" : "COMEÇAR"}</Btn>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FreeSummary({ data, onClose, autoClose }: { data: { win: number; played: number; best: number; bet: number } | null; onClose: () => void; autoClose?: boolean }) {
  useEffect(() => {
    if (!data || !autoClose) return;
    const t = setTimeout(onClose, bigWinTier(data.win) ? 9000 : 4000);
    return () => clearTimeout(t);
  }, [data, autoClose]);
  useEffect(() => {
    if (data) {
      const amount = Math.floor(data.win * data.bet);
      if (bigWinTier(data.win)) showBigWin(amount, data.win, "Bônus de giros grátis");
      else if (amount > 0) celebrate(amount, data.bet);
    }
  }, [data]);
  return (
    <AnimatePresence>
      {data && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="gold-border rounded-3xl p-6 w-full max-w-sm text-center">
            <div className="text-xs font-black tracking-[0.3em] text-gold-300/80">BÔNUS ENCERRADO</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <ChipIcon size={30} />
              <CountUp value={Math.floor(data.win * data.bet)} duration={1.5} className="font-display font-black text-4xl gold-text" />
            </div>
            <div className="text-gold-300 font-extrabold">{fmtMult(data.win)}</div>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <div className="glass rounded-xl py-2"><div className="text-[10px] text-white/50 font-black">GIROS</div><div className="font-extrabold">{data.played}</div></div>
              <div className="glass rounded-xl py-2"><div className="text-[10px] text-white/50 font-black">MELHOR GIRO</div><div className="font-extrabold">{fmt(data.best * data.bet)}</div></div>
            </div>
            <Btn variant="gold" size="lg" className="mt-6 w-full" onClick={onClose}>CONTINUAR</Btn>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===================================================================== minigame "Escolha a Estrela" */
function prizeLabel(p: Prize, bet: number) {
  switch (p.kind) {
    case "credits": return { big: fmt(p.value * bet), small: `${p.value}x`, color: "#fde047" };
    case "mult": return { big: `x${p.value}`, small: "multiplica o bônus", color: "#a78bfa" };
    case "spins": return { big: `+${p.value}`, small: "giros grátis", color: "#f472b6" };
    case "wilds": return { big: `+${p.value}`, small: "portais no próximo giro", color: "#22d3ee" };
    case "joker": return { big: "x2", small: "Estrela da Sorte!", color: "#4ade80" };
  }
}

function PickBonus({ machine, onDone }: { machine: Machine; onDone: (m: Machine) => void }) {
  const bonus = machine.bonus!;
  const [revealed, setRevealed] = useState<Map<number, Prize>>(() => new Map(bonus.revealed.map((r) => [r.index, r.prize])));
  const [all, setAll] = useState<Prize[] | null>(null);
  const [total, setTotal] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [entered, setEntered] = useState(bonus.picks.length > 0);
  const picksLeft = 3 - revealed.size;

  async function pick(i: number) {
    if (busy || revealed.has(i) || picksLeft <= 0) return;
    setBusy(true);
    haptic.impact("medium");
    sfx.flip();
    try {
      const r = await api.post("/cosmic/pick", { index: i });
      const prize: Prize = r.done ? r.cards[i] : r.revealed[r.revealed.length - 1];
      setRevealed((m) => new Map(m).set(i, prize));
      sfx.gem();
      if (r.done) {
        setBalance(r.balance, false);
        await sleep(700);
        setAll(r.cards);
        sfx.whoosh();
        await sleep(900);
        setTotal({ ...r.total, payout: r.payout, roundId: r.roundId, machine: r.machine });
        if (r.total.joker) {
          sfx.jackpot();
          confetti();
        }
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    }
    setBusy(false);
  }

  async function finish() {
    const t = total;
    setTotal(null);
    if (t.payout > 0) await celebrate(t.payout, bonus.bet || 1);
    else revealBalance();
    onDone(t.machine);
  }

  return (
    <motion.div className="fixed inset-0 z-[75] flex flex-col items-center justify-center px-5 bg-[#06040f]/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="stars-layer" />
      {!entered ? (
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="relative text-center">
          <div className="w-32 h-32 mx-auto"><SymbolArt art={COSMIC_ART[2]} /></div>
          <div className="font-display font-black text-3xl gold-text mt-3">ESCOLHA A ESTRELA</div>
          <p className="text-white/70 text-sm mt-2 max-w-xs">9 estrelas guardam prêmios: fichas, multiplicadores, giros grátis ou portais. Escolha 3. A <b className="text-win-400">Estrela da Sorte</b> dobra tudo!</p>
          <Btn variant="gold" size="xl" pulse className="mt-7 w-64 shine" onClick={() => { setEntered(true); sfx.freeSpins(); }}>ABRIR O ORBE</Btn>
        </motion.div>
      ) : (
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-5">
            <div className="font-display font-black text-2xl gold-text">ESCOLHA A ESTRELA</div>
            <div className="text-sm font-bold text-white/70 mt-1">{picksLeft > 0 ? `Escolha mais ${picksLeft}` : total ? "Prêmios revelados" : "Revelando…"}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => {
              const p = revealed.get(i) ?? (all ? all[i] : null);
              const mine = revealed.has(i);
              const lab = p ? prizeLabel(p, bonus.bet || 1) : null;
              return (
                <button key={i} onClick={() => pick(i)} className="aspect-[3/4] [perspective:700px]">
                  <motion.div className="relative w-full h-full [transform-style:preserve-3d]" animate={{ rotateY: p ? 180 : 0 }} transition={{ duration: 0.55, ease: [0.3, 1.3, 0.5, 1] }}>
                    <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl gold-border grid place-items-center overflow-hidden">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} className="absolute w-[180%] h-[180%] opacity-30" style={{ background: "conic-gradient(#7c3aed, #22d3ee, #f472b6, #7c3aed)" }} />
                      <svg viewBox="0 0 100 100" className="relative w-3/5"><path d="M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z" fill="url(#a-gold)" stroke="#fff7d6" strokeWidth="2" /></svg>
                    </div>
                    <div className={cls("absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl grid place-items-center text-center p-1 border", mine ? "bg-space-800 border-gold-400/70" : "bg-space-900/70 border-white/10 opacity-55")}>
                      {lab && (
                        <div>
                          <div className="font-display font-black text-xl leading-none" style={{ color: lab.color }}>{lab.big}</div>
                          <div className="text-[9px] font-bold text-white/60 mt-1 leading-tight">{lab.small}</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {total && (
              <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-6 gold-border rounded-2xl p-4 text-center">
                <div className="text-[11px] font-black tracking-widest text-gold-300/80">PRÊMIO DO MINIGAME</div>
                <div className="text-sm text-white/80 mt-1">
                  {total.credits}x{total.mult > 1 ? ` × ${total.mult}` : ""}{total.joker ? " × 2 (Estrela da Sorte)" : ""}
                </div>
                <div className="font-display font-black text-3xl gold-text mt-1">{fmt(total.payout)}</div>
                {(total.spins > 0 || total.wilds > 0) && (
                  <div className="text-xs font-bold text-white/70 mt-1">
                    {total.spins > 0 && `+${total.spins} giros grátis `}{total.wilds > 0 && `· +${total.wilds} portais no próximo giro`}
                  </div>
                )}
                <Btn variant="gold" size="lg" className="mt-4 w-full" onClick={finish}>VOLTAR AO SLOT</Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ===================================================================== regras e pagamentos */
function Paytable({ bet, pays }: { bet: number; pays?: Record<string, number[]> }) {
  const order = [11, 4, 5, 6, 12, 13, 7, 8, 14, 15, 9, 10];
  const lineBet = bet / 20;
  const scale = 1.06;
  return (
    <div className="pb-6">
      <p className="text-xs text-white/55 mb-3">Valores para a aposta atual ({fmt(bet)}), pagos da esquerda para a direita nas 20 linhas.</p>
      <div className="grid grid-cols-2 gap-2">
        {order.map((s) => (
          <div key={s} className="glass rounded-2xl p-2 flex items-center gap-2">
            <div className="w-12 h-12 shrink-0"><SymbolArt art={COSMIC_ART[s]} /></div>
            <div className="text-[11px] leading-tight">
              <div className="font-extrabold text-white/90 mb-0.5">{COSMIC_NAMES[s]}</div>
              {pays?.[s] && [5, 4, 3].map((n) => (
                <div key={n} className="tabular"><span className="text-white/45">{n}×</span> <b className="text-gold-300">{fmt(Math.floor(pays[s][n - 3] * scale * lineBet))}</b></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5"><Rules /></div>
    </div>
  );
}

function Rules() {
  const item = (s: number, title: string, text: string) => (
    <div className="flex gap-3 items-start">
      <div className="w-11 h-11 shrink-0"><SymbolArt art={COSMIC_ART[s]} /></div>
      <div className="text-sm"><b className="text-white">{title}</b><div className="text-white/65 text-[13px]">{text}</div></div>
    </div>
  );
  return (
    <div className="space-y-3 pb-6">
      {item(0, "Portal (Wild)", "Substitui todos os símbolos comuns. 5 Portais pagam como 5 Olhos do Oráculo.")}
      {item(1, "Nebulosa (Scatter)", "3, 4 ou 5 em qualquer lugar dão 8, 12 ou 20 giros grátis. Nos giros grátis os ganhos valem x2 e 3 Nebulosas dão +5 giros.")}
      {item(2, "Orbe do Destino", "3 orbes (rolos 1, 3 e 5) abrem o minigame Escolha a Estrela: 9 estrelas, você escolhe 3.")}
      {item(3, "Orbe multiplicador", "Mostra x2, x3, x5 ou x10. Os valores somam e multiplicam o ganho do giro.")}
      <div className="pt-1 text-xs font-black tracking-widest text-gold-300/80">ARCANOS DOURADOS</div>
      {item(12, "Sol", "A coluna inteira vira Portal neste giro.")}
      {item(13, "Lua", "Guarda um multiplicador de x2 a x5 para a sua próxima vitória.")}
      {item(14, "Cometa", "Transforma de 2 a 4 símbolos em Portais.")}
      {item(15, "Eclipse", "Re-Spin: os rolos que não formaram vitória giram de novo.")}
      {item(11, "Olho do Oráculo", "O símbolo de maior pagamento do jogo.")}
      <p className="text-xs text-white/45 pt-2">RTP teórico ≈ 96%. Prêmio máximo 50.000x a aposta. Resultados gerados no servidor com RNG verificável (provably fair). Fichas virtuais sem valor monetário.</p>
    </div>
  );
}
