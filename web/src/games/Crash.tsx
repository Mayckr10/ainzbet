import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt, fmtMult } from "../lib/format";
import { sfx } from "../lib/sound";
import { haptic } from "../lib/tg";
import { celebrate } from "../ui/effects";
import { GameShell, sessionAction, shareRound, startSession } from "../ui/GameShell";
import { BetInput, Btn, useBet } from "../ui/kit";
import { revealBalance } from "../lib/store";

type Phase = "idle" | "countdown" | "flying" | "cashed" | "crashed";
const GROWTH = 0.00006;

export default function Crash() {
  const [bet, setBet] = useBet("crash");
  const [auto, setAuto] = useState<string>(() => localStorage.getItem("cc_crash_auto") ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [point, setPoint] = useState<number | null>(null);
  const [hist, setHist] = useState<number[]>(() => JSON.parse(localStorage.getItem("cc_crash_hist") ?? "[]"));
  const [roundId, setRoundId] = useState<number | null>(null);
  const [lastWinId, setLastWinId] = useState<number | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timing = useRef({ startAt: 0, offset: 0 });
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;
  const pointRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("cc_crash_hist", JSON.stringify(hist.slice(0, 20)));
  }, [hist]);

  // retoma rodada ativa
  useEffect(() => {
    api.get("/session/crash/active").then((r) => {
      if (r.active?.view?.startAt) begin(r.active.roundId, r.active.view);
    });
  }, []);

  function begin(id: number, view: any) {
    setRoundId(id);
    timing.current = { startAt: view.startAt, offset: view.serverNow - Date.now() };
    setCashedAt(null);
    setPoint(null);
    pointRef.current = null;
    setMult(1);
    setPhase("countdown");
  }

  async function bet_() {
    if (phase === "countdown" || phase === "flying") return;
    haptic.impact("medium");
    const a = Number(auto.replace(",", "."));
    const params = a >= 1.01 ? { autoCashout: a } : {};
    const r = await startSession("crash", bet, params);
    if (!r) return;
    begin(r.roundId, r.view);
  }

  // animação + polling
  useEffect(() => {
    if (phase !== "countdown" && phase !== "flying") return;
    let raf = 0;
    let lastTick = 0;
    const loop = () => {
      const now = Date.now() + timing.current.offset;
      const t = now - timing.current.startAt;
      if (t < 0) {
        setCountdown(Math.ceil(-t / 100) / 10);
      } else {
        if (phaseRef.current === "countdown") {
          setPhase("flying");
          sfx.spinStart();
        }
        const m = Math.floor(100 * Math.exp(GROWTH * t)) / 100;
        setMult(m);
        if (performance.now() - lastTick > 400 / Math.min(4, m)) {
          lastTick = performance.now();
          sfx.tick();
        }
        draw(t, m, false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const poll = setInterval(async () => {
      if (!roundId) return;
      const now = Date.now() + timing.current.offset;
      if (now < timing.current.startAt) return;
      const r = await sessionAction(roundId, "poll", {}, true);
      if (r?.done) finish(r);
    }, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
    };
  }, [phase === "countdown" || phase === "flying", roundId]);

  async function finish(r: any) {
    const v = r.view;
    if (phaseRef.current === "crashed" || phaseRef.current === "cashed" && !v.point) return;
    setPoint(v.point);
    pointRef.current = v.point;
    setHist((h) => [v.point, ...h].slice(0, 20));
    if (v.outcome === "cashout") {
      setCashedAt(v.cashedAt);
      setPhase("crashed");
      setLastWinId(r.roundId);
      await celebrate(r.payout, bet);
    } else {
      setPhase("crashed");
      sfx.explode();
      haptic.error();
      revealBalance();
    }
    const t = Math.log(v.point) / GROWTH;
    draw(t, v.point, true);
  }

  async function cashout() {
    if (!roundId || phase !== "flying") return;
    haptic.impact("heavy");
    const r = await sessionAction(roundId, "cashout");
    if (r?.done) finish(r);
  }

  function draw(t: number, m: number, crashed: boolean) {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth;
    const H = c.clientHeight;
    if (c.width !== W * dpr) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const pad = { l: 38, r: 16, t: 16, b: 26 };
    const maxT = Math.max(8000, t * 1.15);
    const maxM = Math.max(2, m * 1.2);
    const X = (tt: number) => pad.l + (tt / maxT) * (W - pad.l - pad.r);
    const Y = (mm: number) => H - pad.b - ((mm - 1) / (maxM - 1)) * (H - pad.t - pad.b);
    // grade
    g.strokeStyle = "rgba(255,255,255,0.06)";
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.font = "600 10px Manrope";
    g.lineWidth = 1;
    const steps = [1, 1.5, 2, 3, 5, 10, 20, 50, 100, 250, 500, 1000, 5000, 10000, 50000].filter((s) => s <= maxM);
    const marks = steps.slice(-5);
    for (const s of marks) {
      g.beginPath();
      g.moveTo(pad.l, Y(s));
      g.lineTo(W - pad.r, Y(s));
      g.stroke();
      g.fillText(`${s}x`, 4, Y(s) + 3);
    }
    for (let s = 0; s <= maxT / 1000; s += Math.ceil(maxT / 1000 / 5)) g.fillText(`${s}s`, X(s * 1000) - 6, H - 8);
    // curva
    const color = crashed && !cashedAt ? "#ef4444" : "#4ade80";
    const grad = g.createLinearGradient(0, Y(m), 0, H - pad.b);
    grad.addColorStop(0, crashed && !cashedAt ? "rgba(239,68,68,0.35)" : "rgba(74,222,128,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.beginPath();
    g.moveTo(X(0), Y(1));
    const N = 80;
    for (let i = 1; i <= N; i++) {
      const tt = (t * i) / N;
      g.lineTo(X(tt), Y(Math.exp(GROWTH * tt)));
    }
    g.lineTo(X(t), H - pad.b);
    g.lineTo(X(0), H - pad.b);
    g.fillStyle = grad;
    g.fill();
    g.beginPath();
    g.moveTo(X(0), Y(1));
    for (let i = 1; i <= N; i++) {
      const tt = (t * i) / N;
      g.lineTo(X(tt), Y(Math.exp(GROWTH * tt)));
    }
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.shadowColor = color;
    g.shadowBlur = 14;
    g.stroke();
    g.shadowBlur = 0;
    // foguete
    const x = X(t);
    const y = Y(m);
    const t2 = Math.max(0, t - 300);
    const ang = Math.atan2(Y(Math.exp(GROWTH * t2)) - y, X(t2) - x) + Math.PI;
    g.save();
    g.translate(x, y);
    if (crashed && !cashedAt) {
      g.fillStyle = "#f97316";
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.beginPath();
        g.arc(Math.cos(a) * 14, Math.sin(a) * 14, 4, 0, Math.PI * 2);
        g.fill();
      }
      g.font = "26px serif";
      g.fillText("💥", -14, 9);
    } else {
      g.rotate(ang + Math.PI / 2);
      g.fillStyle = "#fb923c";
      g.beginPath();
      g.moveTo(-5, 10);
      g.lineTo(0, 22 + Math.random() * 6);
      g.lineTo(5, 10);
      g.fill();
      g.fillStyle = "#f5f3ff";
      g.beginPath();
      g.moveTo(0, -16);
      g.quadraticCurveTo(9, -4, 6, 12);
      g.lineTo(-6, 12);
      g.quadraticCurveTo(-9, -4, 0, -16);
      g.fill();
      g.fillStyle = "#22d3ee";
      g.beginPath();
      g.arc(0, -3, 3.5, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  useEffect(() => {
    if (phase === "idle") draw(0, 1, false);
  }, [phase]);

  const flying = phase === "flying";
  const potential = Math.floor(bet * mult);

  return (
    <GameShell title="Crash" game="crash" info={<><p>Aposte e veja o multiplicador subir. Saque antes do crash para receber aposta × multiplicador. Se o foguete explodir antes, você perde a aposta.</p><p>O ponto de crash é sorteado (provably fair) no início e fica em segredo no servidor. O saque automático acontece no servidor, mesmo se você fechar o app. RTP 99%, máximo 50.000x.</p></>}>
      <div className="px-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {hist.map((h, i) => <span key={i} className={cls("shrink-0 rounded-lg px-2 py-1 text-[11px] font-black tabular", h >= 2 ? "bg-win-500/20 text-win-400" : "bg-loss-500/15 text-loss-400")}>{fmtMult(h)}</span>)}
      </div>
      <div className="relative flex-1 mx-3 my-2 rounded-3xl overflow-hidden glass">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <AnimatePresence mode="wait">
            {phase === "countdown" ? (
              <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="text-xs font-black tracking-widest text-white/60">DECOLANDO EM</div>
                <div className="font-display font-black text-5xl">{countdown.toFixed(1)}s</div>
              </motion.div>
            ) : phase === "crashed" ? (
              <motion.div key="cr" initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                <div className={cls("font-display font-black text-5xl", cashedAt ? "text-win-400" : "text-loss-400")}>{fmtMult(point ?? mult)}</div>
                <div className="text-sm font-black mt-1">{cashedAt ? `Você sacou em ${fmtMult(cashedAt)} · +${fmt(Math.floor(bet * cashedAt))}` : "CRASHOU!"}</div>
              </motion.div>
            ) : (
              <motion.div key="m" className={cls("font-display font-black text-6xl tabular", flying ? "text-white" : "text-white/40")}>{fmtMult(mult)}</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-2">
          <BetInput value={bet} onChange={setBet} disabled={flying || phase === "countdown"} />
          <div className={cls("glass rounded-2xl p-1.5 px-3", (flying || phase === "countdown") && "opacity-50")}>
            <div className="text-[10px] font-black text-white/45">SAQUE AUTO</div>
            <input placeholder="ex.: 2,00" inputMode="decimal" value={auto} disabled={flying || phase === "countdown"} onChange={(e) => { setAuto(e.target.value); localStorage.setItem("cc_crash_auto", e.target.value); }} className="bg-transparent outline-none w-full font-extrabold text-base tabular placeholder:text-white/25" />
          </div>
        </div>
        {flying ? (
          <Btn variant="green" size="xl" onClick={cashout} className="pulse-glow">SACAR {fmt(potential)}</Btn>
        ) : (
          <Btn variant="gold" size="xl" disabled={phase === "countdown"} onClick={bet_} pulse={phase !== "countdown"}>{phase === "countdown" ? "AGUARDE…" : "APOSTAR"}</Btn>
        )}
        {phase === "crashed" && cashedAt && lastWinId && <button onClick={() => shareRound(lastWinId)} className="text-[11px] font-black text-plasma-400 press">COMPARTILHAR ↗</button>}
      </div>
    </GameShell>
  );
}
