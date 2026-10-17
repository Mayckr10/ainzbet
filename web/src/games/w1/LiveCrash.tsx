import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { cls, fmt, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { revealBalance } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { celebrate } from "../../ui/effects";
import { GameShell, sessionAction, startSession } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Footer, Hist, ShareLink, useHist, usePersist } from "./common";

const GROWTH = 0.00006;
const multAt = (t: number) => (t <= 0 ? 1 : Math.floor(100 * Math.exp(GROWTH * t)) / 100);
type Phase = "idle" | "countdown" | "flying" | "done";

/** Foguete Duplo (duo) e Aviãozinho (plane). */
export default function LiveCrash({ id }: { id: "crash-duplo" | "crash-aviao" }) {
  const duo = id === "crash-duplo";
  const [bet, setBet] = useBet(id);
  const [autoA, setAutoA] = usePersist(`${id}_a`, "");
  const [autoB, setAutoB] = usePersist(`${id}_b`, "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [roundId, setRoundId] = useState<number | null>(null);
  const [view, setView] = useState<any>(null);
  const [result, setResult] = useState<{ payout: number; id: number } | null>(null);
  const [hist, push] = useHist(id);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timing = useRef({ startAt: 0, offset: 0 });
  const viewRef = useRef<any>(null);
  viewRef.current = view;
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  useEffect(() => {
    api.get(`/session/${id}/active`).then((r) => r.active?.view?.startAt && begin(r.active.roundId, r.active.view)).catch(() => {});
  }, []);

  function begin(rid: number, v: any) {
    setRoundId(rid);
    setView(v);
    setResult(null);
    timing.current = { startAt: v.startAt, offset: v.serverNow - Date.now() };
    setMult(1);
    setPhase("countdown");
  }

  async function play() {
    if (phase === "countdown" || phase === "flying") return;
    const a = Number(String(autoA).replace(",", "."));
    const b = Number(String(autoB).replace(",", "."));
    const params = duo ? { ...(a >= 1.01 ? { auto0: a } : {}), ...(b >= 1.01 ? { auto1: b } : {}) } : a >= 1.01 ? { autoCashout: a } : {};
    const r = await startSession(id, bet, params);
    if (r) begin(r.roundId, r.view);
  }

  function apply(r: any) {
    if (!r) return;
    setView(r.view);
    if (r.done) end(r);
  }

  async function end(r: any) {
    if (phaseRef.current === "done") return;
    setPhase("done");
    const v = r.view;
    const pts: number[] = duo ? v.points : [v.point];
    pts.forEach((p) => p && push(p, p >= 2));
    setResult({ payout: r.payout, id: r.roundId });
    if (r.payout > 0) await celebrate(r.payout, bet);
    else {
      sfx.explode();
      haptic.error();
      revealBalance();
    }
  }

  useEffect(() => {
    if (phase !== "countdown" && phase !== "flying") return;
    let raf = 0;
    let tick = 0;
    const loop = () => {
      const now = Date.now() + timing.current.offset;
      const t = now - timing.current.startAt;
      if (t < 0) setCountdown(Math.ceil(-t / 100) / 10);
      else {
        if (phaseRef.current === "countdown") {
          setPhase("flying");
          sfx.spinStart();
        }
        const m = multAt(t);
        setMult(m);
        if (performance.now() - tick > 400 / Math.min(4, m)) {
          tick = performance.now();
          sfx.tick();
        }
        draw(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const poll = setInterval(async () => {
      if (!roundId || Date.now() + timing.current.offset < timing.current.startAt) return;
      const r = await sessionAction(roundId, "poll", {}, true);
      apply(r);
    }, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
    };
  }, [phase === "countdown" || phase === "flying", roundId]);

  useEffect(() => {
    if (phase === "done" && view) {
      const pts: number[] = duo ? view.points.filter(Boolean) : [view.point];
      const maxP = Math.max(1.01, ...pts, ...(duo ? view.cashed.filter(Boolean) : [view.cashedAt ?? 1]));
      draw(Math.log(maxP) / GROWTH);
    }
    if (phase === "idle") draw(0);
  }, [phase, view]);

  async function cash(which?: number) {
    if (!roundId || phase !== "flying") return;
    haptic.impact("heavy");
    const action = which === -1 ? "half" : "cashout";
    const r = await sessionAction(roundId, action, duo ? { which } : {});
    if (r) {
      if (!r.done && (action === "half" || duo)) sfx.coin();
      apply(r);
    }
  }

  function draw(t: number) {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth;
    const H = c.clientHeight;
    if (c.width !== Math.floor(W * dpr)) {
      c.width = Math.floor(W * dpr);
      c.height = Math.floor(H * dpr);
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const v = viewRef.current;
    const m = multAt(t);
    const pad = { l: 36, r: 20, t: 20, b: 24 };
    const maxT = Math.max(8000, t * 1.15);
    const maxM = Math.max(2, m * 1.2);
    const X = (tt: number) => pad.l + (tt / maxT) * (W - pad.l - pad.r);
    const Y = (mm: number) => H - pad.b - ((mm - 1) / (maxM - 1)) * (H - pad.t - pad.b);
    g.strokeStyle = "rgba(255,255,255,0.06)";
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.font = "600 10px Manrope";
    for (const s of [1, 1.5, 2, 3, 5, 10, 20, 50, 100, 500, 1000, 10000].filter((s) => s <= maxM).slice(-5)) {
      g.beginPath();
      g.moveTo(pad.l, Y(s));
      g.lineTo(W - pad.r, Y(s));
      g.stroke();
      g.fillText(`${s}x`, 4, Y(s) + 3);
    }
    const tracks = duo
      ? [0, 1].map((i) => ({ color: i ? "#38bdf8" : "#f472b6", off: i ? 10 : -10, point: v?.points?.[i] as number | null, cashed: v?.cashed?.[i] as number | null }))
      : [{ color: "#fbbf24", off: 0, point: v?.point as number | null, cashed: v?.cashedAt as number | null }];
    for (const tr of tracks) {
      const crashedAt = tr.point && multAt(t) >= tr.point ? Math.log(tr.point) / GROWTH : null;
      const tEnd = crashedAt != null ? Math.min(t, crashedAt) : t;
      const exploded = crashedAt != null && (!tr.cashed || tr.cashed === 0);
      g.beginPath();
      g.moveTo(X(0), Y(1) + tr.off * 0);
      for (let i = 1; i <= 70; i++) {
        const tt = (tEnd * i) / 70;
        g.lineTo(X(tt), Y(Math.exp(GROWTH * tt)) + (tr.off * i) / 70);
      }
      g.strokeStyle = exploded ? "#ef4444" : tr.color;
      g.lineWidth = 4;
      g.shadowColor = g.strokeStyle as string;
      g.shadowBlur = 12;
      g.stroke();
      g.shadowBlur = 0;
      const x = X(tEnd);
      const y = Y(Math.exp(GROWTH * tEnd)) + tr.off;
      if (exploded) {
        g.font = "24px serif";
        g.fillText("💥", x - 12, y + 8);
      } else if (duo) {
        g.save();
        g.translate(x, y);
        g.rotate(-0.6);
        g.fillStyle = tr.color;
        g.beginPath();
        g.moveTo(14, 0);
        g.quadraticCurveTo(0, -7, -12, -5);
        g.lineTo(-12, 5);
        g.quadraticCurveTo(0, 7, 14, 0);
        g.fill();
        g.fillStyle = "#fb923c";
        g.beginPath();
        g.moveTo(-12, -3);
        g.lineTo(-22 - Math.random() * 6, 0);
        g.lineTo(-12, 3);
        g.fill();
        g.restore();
      } else {
        // avião
        g.save();
        g.translate(x, y);
        g.rotate(-0.35);
        g.fillStyle = "#ef4444";
        g.beginPath();
        g.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#fecaca";
        g.fillRect(-4, -14, 7, 28);
        g.fillStyle = "#ef4444";
        g.fillRect(-18, -8, 4, 8);
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(10, -1, 2.5, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      if (tr.cashed) {
        const tc = Math.log(tr.cashed) / GROWTH;
        if (tc <= t) {
          g.fillStyle = "#4ade80";
          g.beginPath();
          g.arc(X(tc), Y(tr.cashed) + (tr.off * Math.min(1, tc / Math.max(1, tEnd))), 5, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    if (!duo && v?.half) {
      const tc = Math.log(v.half) / GROWTH;
      g.fillStyle = "#4ade80";
      g.font = "800 10px Manrope";
      g.fillText(`½ ${v.half.toFixed(2)}x`, X(tc) - 14, Y(v.half) - 10);
    }
  }

  const flying = phase === "flying";
  const halfBet = [Math.floor(bet / 2), bet - Math.floor(bet / 2)];
  const cashed: (number | null)[] = duo ? view?.cashed ?? [null, null] : [];
  const points: (number | null)[] = duo ? view?.points ?? [null, null] : [];

  return (
    <GameShell
      title={duo ? "Foguete Duplo" : "Aviãozinho"}
      game={id}
      bg={duo ? "radial-gradient(70% 45% at 30% 20%, rgba(244,114,182,0.25), transparent 70%), radial-gradient(70% 45% at 70% 20%, rgba(56,189,248,0.25), transparent 70%), linear-gradient(180deg,#0a0716,#04030a)" : "radial-gradient(80% 50% at 50% 10%, rgba(239,68,68,0.3), transparent 70%), linear-gradient(180deg,#140808,#060303)"}
      info={
        duo ? (
          <><p>Dois foguetes decolam juntos, cada um com metade da sua aposta e um ponto de explosão sorteado de forma independente. Saque cada um quando quiser (ou defina saques automáticos diferentes).</p><p>Estratégia clássica: um saque seguro baixo e outro arriscado alto. RTP 99%, máximo 50.000x.</p></>
        ) : (
          <><p>O avião sobe e o multiplicador cresce. Você pode sacar METADE da aposta uma vez e deixar a outra metade voando, ou sacar tudo de uma vez.</p><p>Se o avião sumir antes do seu saque, a parte que ainda estava voando é perdida. RTP 99%, máximo 50.000x.</p></>
        )
      }
    >
      <Hist items={hist} />
      <div className="relative flex-1 min-h-0 mx-3 my-2 rounded-3xl overflow-hidden glass">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <AnimatePresence mode="wait">
            {phase === "countdown" ? (
              <motion.div key="cd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="text-xs font-black tracking-widest text-white/60">DECOLANDO EM</div>
                <div className="font-display font-black text-5xl">{countdown.toFixed(1)}s</div>
              </motion.div>
            ) : phase === "done" ? (
              <motion.div key="dn" initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                {duo ? (
                  <div className="flex gap-6">
                    {[0, 1].map((i) => (
                      <div key={i}>
                        <div className="text-[10px] font-black" style={{ color: i ? "#38bdf8" : "#f472b6" }}>{i ? "AZUL" : "ROSA"}</div>
                        <div className={cls("font-display font-black text-3xl", cashed[i] ? "text-win-400" : "text-loss-400")}>{fmtMult(points[i] ?? 1)}</div>
                        <div className="text-[11px] font-black text-white/60">{cashed[i] ? `sacou ${fmtMult(cashed[i]!)}` : "explodiu"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className={cls("font-display font-black text-5xl", (result?.payout ?? 0) > 0 ? "text-win-400" : "text-loss-400")}>{fmtMult(view?.point ?? mult)}</div>
                    <div className="text-sm font-black">{view?.cashedAt ? `Sacou em ${fmtMult(view.cashedAt)}` : view?.half ? "Metade salva!" : "VOOU PARA LONGE!"}</div>
                  </>
                )}
                <div className="mt-1 text-sm font-black text-gold-300">{result?.payout ? `+${fmt(result.payout)}` : ""}</div>
              </motion.div>
            ) : (
              <motion.div key="m" className={cls("font-display font-black text-6xl tabular", flying ? "text-white" : "text-white/40")}>{fmtMult(mult)}</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer>
        {flying ? (
          duo ? (
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => (
                <Btn key={i} variant={cashed[i] != null ? "glass" : "green"} size="xl" disabled={cashed[i] != null} onClick={() => cash(i)}>
                  {cashed[i] != null ? (cashed[i] ? `✓ ${fmtMult(cashed[i]!)}` : "💥") : `${i ? "AZUL" : "ROSA"} ${fmt(halfBet[i] * mult)}`}
                </Btn>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="violet" size="xl" disabled={!!view?.half} onClick={() => cash(-1)}>{view?.half ? `½ ✓ ${fmtMult(view.half)}` : `SACAR ½ ${fmt(halfBet[0] * mult)}`}</Btn>
              <Btn variant="green" size="xl" onClick={() => cash()}>SACAR {fmt((view?.half ? halfBet[1] : bet) * mult)}</Btn>
            </div>
          )
        ) : (
          <>
            {duo && <BetInput value={bet} onChange={setBet} disabled={phase === "countdown"} label="Aposta total (metade em cada)" />}
            <div className={cls("grid gap-2", duo ? "grid-cols-2" : "grid-cols-[minmax(0,1fr)_100px]")}>
              {!duo && <BetInput value={bet} onChange={setBet} disabled={phase === "countdown"} />}
              <div className="glass rounded-2xl p-1.5 px-2.5">
                <div className="text-[9px] font-black text-white/45 truncate">{duo ? "AUTO ROSA" : "SAQUE AUTO"}</div>
                <input placeholder="2,00" inputMode="decimal" value={autoA} onChange={(e) => setAutoA(e.target.value)} className="bg-transparent outline-none w-full font-extrabold tabular placeholder:text-white/25" />
              </div>
              {duo && (
                <div className="glass rounded-2xl p-1.5 px-2.5">
                  <div className="text-[9px] font-black text-white/45 truncate">AUTO AZUL</div>
                  <input placeholder="10,00" inputMode="decimal" value={autoB} onChange={(e) => setAutoB(e.target.value)} className="bg-transparent outline-none w-full font-extrabold tabular placeholder:text-white/25" />
                </div>
              )}
            </div>
            <Btn variant="gold" size="xl" disabled={phase === "countdown" || bet < 2} pulse={phase !== "countdown"} onClick={play}>{phase === "countdown" ? "AGUARDE…" : duo ? `APOSTAR · ${fmt(halfBet[0])} + ${fmt(halfBet[1])}` : "APOSTAR"}</Btn>
            <ShareLink id={result?.payout ? result.id : null} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
