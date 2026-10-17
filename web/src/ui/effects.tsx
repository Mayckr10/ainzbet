import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fmt, fmtMult } from "../lib/format";
import { sfx } from "../lib/sound";
import { haptic } from "../lib/tg";
import { appStore, revealBalance } from "../lib/store";
import { ChipIcon, CountUp } from "./kit";

/* ===================================================================== bus de efeitos */
type BigWinReq = { amount: number; mult: number; tier: "big" | "mega" | "epic"; title?: string; resolve: () => void };
type Burst = { id: number; x: number; y: number; n: number };
const fx = {
  bigWin: null as BigWinReq | null,
  bursts: [] as Burst[],
  confetti: 0,
  subs: new Set<() => void>(),
  emit() {
    this.subs.forEach((f) => f());
  },
};
let burstId = 0;

/** Dispara moedas voando de um ponto (ou do centro) até o saldo. */
export function coinBurst(from?: { x: number; y: number } | HTMLElement | null, n = 14) {
  if (appStore.get().settings.quality === "low") n = Math.min(n, 6);
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (from instanceof HTMLElement) {
    const r = from.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (from) ({ x, y } = from);
  fx.bursts = [...fx.bursts, { id: ++burstId, x, y, n }];
  fx.emit();
}

export function confetti() {
  fx.confetti++;
  fx.emit();
}

export function bigWinTier(mult: number): "big" | "mega" | "epic" | null {
  return mult >= 100 ? "epic" : mult >= 40 ? "mega" : mult >= 15 ? "big" : null;
}

/** Mostra a tela de BIG / MEGA / EPIC WIN e resolve quando o jogador fecha. */
export function showBigWin(amount: number, mult: number, title?: string) {
  const tier = bigWinTier(mult);
  if (!tier) return Promise.resolve();
  return new Promise<void>((resolve) => {
    fx.bigWin = { amount, mult, tier, title, resolve };
    fx.emit();
  });
}

/** Comemoração padrão de um resultado: moedas + saldo + (se for grande) tela especial. */
export async function celebrate(payout: number, bet: number, from?: HTMLElement | null) {
  if (payout <= 0) {
    revealBalance();
    return;
  }
  const mult = bet > 0 ? payout / bet : 0;
  if (bigWinTier(mult)) {
    await showBigWin(payout, mult);
  } else {
    if (mult >= 1) sfx.win(mult >= 5);
    else sfx.smallWin();
    haptic.success();
    coinBurst(from, mult >= 5 ? 22 : 12);
    setTimeout(revealBalance, 650);
  }
}

/* ===================================================================== componentes */
export function EffectsLayer() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    fx.subs.add(f);
    return () => {
      fx.subs.delete(f);
    };
  }, []);
  return (
    <>
      {fx.bursts.map((b) => (
        <CoinFlight key={b.id} burst={b} onDone={() => {
          fx.bursts = fx.bursts.filter((x) => x.id !== b.id);
          fx.emit();
        }} />
      ))}
      <ConfettiCanvas trigger={fx.confetti} />
      <BigWinOverlay req={fx.bigWin} onClose={() => {
        const r = fx.bigWin;
        fx.bigWin = null;
        fx.emit();
        revealBalance();
        r?.resolve();
      }} />
    </>
  );
}

function CoinFlight({ burst, onDone }: { burst: Burst; onDone: () => void }) {
  const target = document.querySelector("[data-balance-target]")?.getBoundingClientRect();
  const tx = target ? target.left + 18 : window.innerWidth - 60;
  const ty = target ? target.top + target.height / 2 : 30;
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    for (let i = 0; i < Math.min(burst.n, 8); i++) setTimeout(() => sfx.coin(), 500 + i * 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[90]">
      {Array.from({ length: burst.n }).map((_, i) => {
        const a = (i / burst.n) * Math.PI * 2 + Math.random() * 0.5;
        const r = 40 + Math.random() * 70;
        const mx = burst.x + Math.cos(a) * r;
        const my = burst.y + Math.sin(a) * r;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: 0, top: 0 }}
            initial={{ x: burst.x - 11, y: burst.y - 11, scale: 0.4, opacity: 0 }}
            animate={{ x: [burst.x - 11, mx - 11, tx - 11], y: [burst.y - 11, my - 11, ty - 11], scale: [0.4, 1.15, 0.6], opacity: [0, 1, 1, 0.2], rotate: [0, 180, 540] }}
            transition={{ duration: 1 + Math.random() * 0.25, times: [0, 0.35, 1], ease: ["easeOut", [0.6, 0, 0.9, 0.6]], delay: i * 0.025 }}
          >
            <ChipIcon size={22} />
          </motion.div>
        );
      })}
    </div>
  );
}

function ConfettiCanvas({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    if (appStore.get().settings.quality === "low") return;
    const c = ref.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    const colors = ["#f5c451", "#ffe7a3", "#a78bfa", "#22d3ee", "#f472b6", "#4ade80"];
    const parts = Array.from({ length: 160 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
      y: window.innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 18 - 6,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
      star: Math.random() < 0.25,
    }));
    let raf = 0;
    let frame = 0;
    const loop = () => {
      frame++;
      g.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.vy += 0.42;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.fillStyle = p.c;
        if (p.star) {
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const rr = i % 2 ? p.w * 0.45 : p.w;
            const aa = (i / 10) * Math.PI * 2;
            g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
          }
          g.fill();
        } else {
          g.scale(1, Math.cos(frame * 0.12 + p.r));
          g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        g.restore();
      }
      if (frame < 200) raf = requestAnimationFrame(loop);
      else g.clearRect(0, 0, c.width, c.height);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [trigger]);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[95]" style={{ width: "100vw", height: "100vh" }} />;
}

const TIER_STYLE = {
  big: { label: "BIG WIN", grad: "from-[#fff3c4] via-[#f5c451] to-[#c27c0e]", glow: "rgba(245,196,81,0.55)", dur: 2.6 },
  mega: { label: "MEGA WIN", grad: "from-[#f5f3ff] via-[#a78bfa] to-[#6d28d9]", glow: "rgba(167,139,250,0.6)", dur: 3.6 },
  epic: { label: "EPIC WIN", grad: "from-[#ecfeff] via-[#22d3ee] to-[#db2777]", glow: "rgba(34,211,238,0.6)", dur: 5 },
} as const;

function BigWinOverlay({ req, onClose }: { req: BigWinReq | null; onClose: () => void }) {
  const [value, setValue] = useState(0);
  const [stage, setStage] = useState<"counting" | "done">("counting");
  useEffect(() => {
    if (!req) return;
    setValue(0);
    setStage("counting");
    sfx.jackpot();
    haptic.impact("heavy");
    confetti();
    const t1 = setTimeout(() => setValue(req.amount), 60);
    const st = TIER_STYLE[req.tier];
    const t2 = setTimeout(() => {
      setStage("done");
      haptic.success();
      coinBurst(null, 26);
      if (req.tier !== "big") confetti();
    }, st.dur * 1000);
    const t3 = setTimeout(onClose, st.dur * 1000 + 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [req]);

  return (
    <AnimatePresence>
      {req && (
        <motion.div
          className="fixed inset-0 z-[92] flex flex-col items-center justify-center bg-black/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => (stage === "done" ? onClose() : setStage("done"))}
        >
          <div className="absolute w-[520px] h-[520px] rounded-full spin-slow" style={{ background: `conic-gradient(from 0deg, transparent, ${TIER_STYLE[req.tier].glow}, transparent 20%, transparent 50%, ${TIER_STYLE[req.tier].glow}, transparent 70%)` }} />
          <motion.div
            initial={{ scale: 0.2, rotate: -12, opacity: 0 }}
            animate={{ scale: [0.2, 1.25, 1], rotate: [-12, 4, 0], opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative text-center px-6"
          >
            {req.title && <div className="text-white/70 font-bold mb-2 tracking-widest text-xs uppercase">{req.title}</div>}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className={`font-display font-black text-[52px] leading-none bg-gradient-to-b ${TIER_STYLE[req.tier].grad} bg-clip-text text-transparent drop-shadow-[0_6px_30px_${TIER_STYLE[req.tier].glow}]`}
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.25)", filter: `drop-shadow(0 8px 28px ${TIER_STYLE[req.tier].glow})` }}
            >
              {TIER_STYLE[req.tier].label}
            </motion.div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <ChipIcon size={36} />
              <CountUp
                value={stage === "done" ? req.amount : value}
                duration={stage === "done" ? 0.2 : TIER_STYLE[req.tier].dur}
                className="font-display font-black text-4xl text-white"
                onTick={sfx.count}
              />
            </div>
            <div className="mt-2 text-gold-300 font-extrabold text-lg">{fmtMult(req.mult)}</div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: stage === "done" ? 1 : 0 }} className="mt-10 text-white/50 text-xs font-bold tracking-widest">
              TOQUE PARA CONTINUAR
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===================================================================== banner de resultado */
export function ResultBanner({ show, win, amount, mult, label }: { show: boolean; win: boolean; amount?: number; mult?: number; label?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 16, stiffness: 300 }}
          className={`px-5 py-3 rounded-2xl text-center shadow-2xl border ${win ? "bg-win-500/15 border-win-400/50" : "bg-white/5 border-white/10"}`}
        >
          <div className={`font-display font-black text-xl ${win ? "text-win-400" : "text-white/70"}`}>{label ?? (win ? `+${fmt(amount ?? 0)}` : "Não foi dessa vez")}</div>
          {win && mult != null && <div className="text-xs font-extrabold text-win-400/80 mt-0.5">{fmtMult(mult)}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
