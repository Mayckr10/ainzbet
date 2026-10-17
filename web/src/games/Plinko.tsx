import { useEffect, useRef, useState } from "react";
import { cls, fmt } from "../lib/format";
import { sfx } from "../lib/sound";
import { revealBalance, speedFactor, useApp } from "../lib/store";
import { haptic } from "../lib/tg";
import { coinBurst, showBigWin, bigWinTier } from "../ui/effects";
import { GameShell, playInstant } from "../ui/GameShell";
import { BetInput, Btn, Segmented, useBet } from "../ui/kit";

type Ball = { path: number[]; start: number; bucket: number; payout: number; bet: number; mult: number; done?: boolean };

function bucketColor(m: number) {
  if (m >= 100) return ["#ef4444", "#7f1d1d"];
  if (m >= 10) return ["#f97316", "#7c2d12"];
  if (m >= 2) return ["#eab308", "#713f12"];
  if (m >= 1) return ["#84cc16", "#365314"];
  return ["#6366f1", "#312e81"];
}

export default function Plinko() {
  const tables = useApp((s) => s.config?.plinko ?? {});
  const [bet, setBet] = useBet("plinko", 10);
  const [rows, setRows] = useState(() => Number(localStorage.getItem("cc_plinko_rows")) || 12);
  const [risk, setRisk] = useState<"low" | "medium" | "high">(() => (localStorage.getItem("cc_plinko_risk") as any) || "medium");
  const [inFlight, setInFlight] = useState(0);
  const [auto, setAuto] = useState(false);
  const [last, setLast] = useState<{ m: number; win: boolean }[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const balls = useRef<Ball[]>([]);
  const hitBucket = useRef<{ i: number; t: number } | null>(null);
  const table: number[] = tables[`${rows}-${risk}`] ?? [];

  useEffect(() => {
    localStorage.setItem("cc_plinko_rows", String(rows));
    localStorage.setItem("cc_plinko_risk", risk);
  }, [rows, risk]);

  // loop de desenho
  useEffect(() => {
    let raf = 0;
    const draw = () => {
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
      const top = 24;
      const bottomBand = 34;
      const gapY = (H - top - bottomBand - 14) / rows;
      const gapX = Math.min(gapY * 1.15, (W - 16) / (rows + 2));
      const pegR = Math.max(2.2, gapX * 0.11);
      const peg = (r: number, i: number) => ({ x: W / 2 + (i - (r + 2) / 2) * gapX, y: top + r * gapY });
      // pinos
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < r + 3; i++) {
          const p = peg(r, i);
          g.beginPath();
          g.arc(p.x, p.y, pegR, 0, Math.PI * 2);
          g.fillStyle = "rgba(233,213,255,0.85)";
          g.fill();
        }
      }
      // caçapas
      const by = top + rows * gapY + 4;
      const n = rows + 1;
      table.forEach((m, i) => {
        const x = W / 2 + (i - n / 2) * gapX;
        const [c1, c2] = bucketColor(m);
        const active = hitBucket.current && hitBucket.current.i === i && performance.now() - hitBucket.current.t < 300;
        const yy = by + (active ? 4 : 0);
        const grad = g.createLinearGradient(0, yy, 0, yy + bottomBand - 8);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        g.fillStyle = grad;
        g.beginPath();
        g.roundRect(x + 1.5, yy, gapX - 3, bottomBand - 8, 5);
        g.fill();
        g.fillStyle = "#fff";
        g.font = `800 ${Math.max(7, Math.min(11, gapX * 0.32))}px Manrope`;
        g.textAlign = "center";
        g.fillText(m >= 1000 ? `${m / 1000}K` : `${m}`, x + gapX / 2, yy + (bottomBand - 8) / 2 + 4);
      });
      // bolas
      const now = performance.now();
      const stepMs = 135 * speedFactor() + 40;
      const ballR = Math.max(4, gapX * 0.2);
      const levelX = (col: number, k: number) => W / 2 + (col - k / 2) * gapX;
      const levelY = (k: number) => (k >= rows ? by + 6 : top + k * gapY - ballR - pegR);
      for (const b of balls.current) {
        const tt = (now - b.start) / stepMs - 1; // -1..0 = queda inicial
        let x: number;
        let y: number;
        if (tt < 0) {
          const f = tt + 1;
          x = W / 2;
          y = top - gapY * 1.2 + (levelY(0) - (top - gapY * 1.2)) * f * f;
        } else {
          const k = Math.min(rows - 1, Math.floor(tt));
          const f = Math.min(1, tt - k);
          let col = 0;
          for (let j = 0; j < k; j++) col += b.path[j];
          const x0 = levelX(col, k);
          const x1 = levelX(col + b.path[k], k + 1);
          x = x0 + (x1 - x0) * f;
          y = levelY(k) + (levelY(k + 1) - levelY(k)) * f - Math.sin(f * Math.PI) * gapY * 0.32;
          if (f < 0.07 && !(b as any)[`s${k}`]) {
            (b as any)[`s${k}`] = 1;
            sfx.ball();
          }
        }
        if (tt >= rows && !b.done) {
          b.done = true;
          land(b);
        }
        if (!b.done) {
          g.beginPath();
          g.arc(x, y, ballR, 0, Math.PI * 2);
          const bg = g.createRadialGradient(x - 2, y - 2, 1, x, y, ballR);
          bg.addColorStop(0, "#fff");
          bg.addColorStop(1, "#f472b6");
          g.fillStyle = bg;
          g.shadowColor = "#f472b6";
          g.shadowBlur = 10;
          g.fill();
          g.shadowBlur = 0;
        }
      }
      balls.current = balls.current.filter((b) => !b.done);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [rows, risk, table.length]);

  function land(b: Ball) {
    hitBucket.current = { i: b.bucket, t: performance.now() };
    setInFlight((x) => x - 1);
    setLast((l) => [{ m: b.mult, win: b.mult >= 1 }, ...l].slice(0, 10));
    if (bigWinTier(b.mult)) showBigWin(b.payout, b.mult);
    else {
      if (b.mult >= 1) {
        sfx.win(b.mult >= 3);
        haptic.success();
        if (b.mult >= 2) coinBurst({ x: window.innerWidth / 2, y: window.innerHeight * 0.6 }, 8);
      } else {
        sfx.pop();
        haptic.impact("light");
      }
      revealBalance();
    }
  }

  async function drop() {
    haptic.impact("light");
    const r = await playInstant<{ path: number[]; bucket: number; multiplier: number }>("plinko", bet, { rows, risk });
    if (!r) return setAuto(false);
    setInFlight((x) => x + 1);
    balls.current.push({ path: r.result.path, bucket: r.result.bucket, start: performance.now(), payout: r.payout, bet, mult: r.result.multiplier });
  }

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(drop, 600);
    return () => clearInterval(t);
  }, [auto, bet, rows, risk]);

  return (
    <GameShell title="Plinko" game="plinko" info={<><p>Solte a bola: em cada pino ela vai para a esquerda ou direita (50%). A caçapa final define o multiplicador.</p><p>Escolha de 8 a 16 linhas e o risco. RTP ≈ 99%, até 1.000x.</p></>}>
      <div className="px-3 flex gap-1.5 h-7">
        {last.map((l, i) => <span key={i} className={cls("rounded-lg px-2 py-1 text-[11px] font-black", l.win ? "bg-win-500/20 text-win-400" : "bg-white/5 text-white/50")}>{l.m}x</span>)}
      </div>
      <div className="flex-1 relative mx-2">
        <canvas ref={canvas} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="px-3 flex flex-col gap-2" style={{ paddingBottom: "calc(var(--safe-bottom) + 10px)" }}>
        <Segmented value={risk} onChange={setRisk} disabled={inFlight > 0} options={[{ value: "low", label: "Baixo" }, { value: "medium", label: "Médio" }, { value: "high", label: "Alto" }]} />
        <div className={cls("glass rounded-2xl px-3 py-2 flex items-center gap-3", inFlight > 0 && "opacity-50 pointer-events-none")}>
          <span className="text-[11px] font-black text-white/50 w-16">LINHAS {rows}</span>
          <input type="range" min={8} max={16} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="flex-1" />
        </div>
        <BetInput value={bet} onChange={setBet} />
        <div className="flex gap-2">
          <Btn variant="glass" size="lg" className="w-24" onClick={() => setAuto((a) => !a)}>{auto ? "PARAR" : "AUTO"}</Btn>
          <Btn variant="gold" size="lg" className="flex-1" pulse onClick={drop}>SOLTAR BOLA · {fmt(bet)}</Btn>
        </div>
      </div>
    </GameShell>
  );
}
