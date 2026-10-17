import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, Hist, ShareLink, useHist } from "./common";

type Obj = { kind: "fruit" | "bomb"; m: number; type: number; x: number };
type Live = Obj & { id: number; cut: boolean; t0: number };
const NEON = ["#22d3ee", "#a3e635", "#f472b6", "#facc15", "#c084fc", "#fb923c"];
const SHAPES = ["circle", "tri", "diamond", "star", "hex", "crown"];

function NeonShape({ type, half }: { type: number; half?: 0 | 1 }) {
  const c = NEON[type];
  const s = SHAPES[type];
  const clip = half == null ? undefined : half === 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)";
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ clipPath: clip, filter: `drop-shadow(0 0 8px ${c}) drop-shadow(0 0 16px ${c})` }}>
      {s === "circle" && <circle cx="50" cy="50" r="34" fill="none" stroke={c} strokeWidth="9" />}
      {s === "tri" && <path d="M50 14 L88 82 H12 Z" fill="none" stroke={c} strokeWidth="9" strokeLinejoin="round" />}
      {s === "diamond" && <path d="M50 10 L88 50 L50 90 L12 50 Z" fill="none" stroke={c} strokeWidth="9" strokeLinejoin="round" />}
      {s === "star" && <path d="M50 10 L61 38 L90 40 L67 58 L75 88 L50 71 L25 88 L33 58 L10 40 L39 38 Z" fill="none" stroke={c} strokeWidth="8" strokeLinejoin="round" />}
      {s === "hex" && <path d="M28 14 H72 L92 50 L72 86 H28 L8 50 Z" fill="none" stroke={c} strokeWidth="9" strokeLinejoin="round" />}
      {s === "crown" && <path d="M12 76 L18 26 L36 50 L50 18 L64 50 L82 26 L88 76 Z" fill={c} fillOpacity=".25" stroke={c} strokeWidth="8" strokeLinejoin="round" />}
      <circle cx="50" cy="50" r="10" fill={c} opacity=".9" />
    </svg>
  );
}
function NeonBomb() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 18px #ef4444)" }}>
      <circle cx="46" cy="58" r="30" fill="#0a0a0a" stroke="#ef4444" strokeWidth="7" />
      <path d="M62 30 C 70 16, 82 18, 86 8" stroke="#f97316" strokeWidth="5" fill="none" />
      <circle cx="86" cy="8" r="6" fill="#fde047" />
      <path d="M36 50 L56 70 M56 50 L36 70" stroke="#ef4444" strokeWidth="6" />
    </svg>
  );
}

export default function FrutaNeon() {
  const [bet, setBet] = useBet("fruta-neon");
  const [live, setLive] = useState<Live[]>([]);
  const [score, setScore] = useState(0);
  const [boom, setBoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [lastId, setLastId] = useState<number | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number; k: number }[]>([]);
  const [hist, push] = useHist("fruta-neon");
  const stage = useRef<HTMLDivElement>(null);
  const down = useRef(false);
  const liveRef = useRef<Live[]>([]);
  liveRef.current = live;

  function cut(id: number) {
    const o = liveRef.current.find((x) => x.id === id);
    if (!o || o.cut) return;
    setLive((l) => l.map((x) => (x.id === id ? { ...x, cut: true } : x)));
    if (o.kind === "bomb") {
      setBoom(true);
      sfx.explode();
      haptic.error();
    } else {
      setScore((s) => Math.round((s + o.m) * 100) / 100);
      sfx.pop();
      haptic.impact("light");
    }
  }

  function onMove(e: React.PointerEvent) {
    if (!down.current || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    setTrail((t) => [...t.slice(-7), { x: e.clientX - rect.left, y: e.clientY - rect.top, k: performance.now() }]);
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      const id = (el as HTMLElement).dataset?.obj;
      if (id) cut(Number(id));
    }
  }

  async function play() {
    if (busy) return;
    setBusy(true);
    setLive([]);
    setScore(0);
    setBoom(false);
    setDone(null);
    haptic.impact("medium");
    const r = await playInstant<{ objects: Obj[]; exploded: boolean; multiplier: number }>("fruta-neon", bet, {});
    if (!r) return setBusy(false);
    const sf = speedFactor();
    const flight = 2200 * sf;
    let id = 0;
    for (const o of r.result.objects) {
      setLive((l) => [...l, { ...o, id: ++id, cut: false, t0: performance.now() }]);
      sfx.whoosh();
      await sleep(430 * sf);
    }
    await sleep(flight - 300);
    // o que não foi cortado é cortado automaticamente (o prêmio já foi definido no servidor)
    for (const o of liveRef.current) if (!o.cut) cut(o.id);
    await sleep(500);
    setScore(r.result.multiplier);
    setDone(r.result.multiplier);
    push(r.result.multiplier, r.result.multiplier >= 1);
    if (r.payout > bet) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  return (
    <GameShell
      title="Corte da Fruta Neon"
      game="fruta-neon"
      bg="radial-gradient(80% 50% at 50% 100%, rgba(217,70,239,0.3), transparent 70%), linear-gradient(180deg,#05010d,#0b0420)"
      info={<><p>Até 10 formas de neon são lançadas. Deslize o dedo para cortá-las: cada forma vale de 0,1x a 15x e o prêmio é a soma de tudo que aparecer antes de uma bomba.</p><p>O resultado é sorteado no servidor antes do lançamento; cortar é pura diversão (o que escapar é cortado sozinho no fim). Chance de bomba por objeto: 15%. RTP ≈ 97%.</p></>}
    >
      <Hist items={hist} />
      <div className="px-3 grid grid-cols-2 gap-2 pt-1">
        <div className="glass rounded-xl py-1.5 text-center"><div className="text-[9px] font-black text-white/45">SOMA</div><div className="font-extrabold text-win-400 tabular">{fmtMult(score)}</div></div>
        <div className="glass rounded-xl py-1.5 text-center"><div className="text-[9px] font-black text-white/45">PRÊMIO</div><div className="font-extrabold text-gold-300 tabular">{fmt(bet * score)}</div></div>
      </div>
      <div
        ref={stage}
        className="relative flex-1 min-h-0 mx-3 my-2 rounded-3xl overflow-hidden border border-fuchsia-400/20 touch-none select-none"
        style={{ background: "linear-gradient(180deg,rgba(15,5,35,0.9),rgba(35,8,60,0.9)), repeating-linear-gradient(90deg,rgba(217,70,239,0.08) 0 1px,transparent 1px 40px), repeating-linear-gradient(0deg,rgba(217,70,239,0.08) 0 1px,transparent 1px 40px)" }}
        onPointerDown={(e) => { down.current = true; onMove(e); }}
        onPointerUp={() => { down.current = false; setTrail([]); }}
        onPointerLeave={() => { down.current = false; setTrail([]); }}
        onPointerMove={onMove}
      >
        <AnimatePresence>
          {live.map((o) => {
            const dx = (o.x - 0.5) * 40;
            return (
              <motion.div
                key={o.id}
                data-obj={o.cut ? undefined : o.id}
                className="absolute w-[68px] h-[68px] -ml-[34px]"
                style={{ left: `${12 + o.x * 76}%`, bottom: -70 }}
                initial={{ y: 0, x: 0, rotate: 0 }}
                animate={{ y: [0, -340 - (o.id % 3) * 40, 40], x: [0, dx, dx * 2], rotate: o.id % 2 ? 300 : -300 }}
                transition={{ duration: 2.2 * speedFactor(), ease: ["easeOut", "easeIn"], times: [0, 0.5, 1] }}
              >
                <div data-obj={o.cut ? undefined : o.id} className="absolute inset-0">
                  {o.kind === "bomb" ? (
                    !o.cut && <NeonBomb />
                  ) : o.cut ? (
                    <>
                      <motion.div className="absolute inset-0" animate={{ x: -24, rotate: -40, opacity: 0 }} transition={{ duration: 0.6 }}><NeonShape type={o.type} half={0} /></motion.div>
                      <motion.div className="absolute inset-0" animate={{ x: 24, rotate: 40, opacity: 0 }} transition={{ duration: 0.6 }}><NeonShape type={o.type} half={1} /></motion.div>
                      <motion.div className="absolute inset-0 grid place-items-center font-display font-black text-lg" style={{ color: NEON[o.type], textShadow: `0 0 10px ${NEON[o.type]}` }} initial={{ scale: 0.5 }} animate={{ scale: 1.3, y: -30, opacity: [1, 1, 0] }} transition={{ duration: 1 }}>
                        +{o.m}x
                      </motion.div>
                    </>
                  ) : (
                    <NeonShape type={o.type} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {trail.length > 1 && <polyline points={trail.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#f0abfc" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px #e879f9)" }} />}
        </svg>
        {boom && <motion.div className="absolute inset-0 bg-red-500/40 pointer-events-none" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />}
        {!busy && done == null && <div className="absolute inset-0 grid place-items-center text-center text-white/50 text-sm font-bold px-10 pointer-events-none">Toque em LANÇAR e deslize o dedo para cortar as formas de neon</div>}
        {done != null && (
          <motion.div initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className={cls("font-display font-black text-5xl", done >= 1 ? "text-win-400" : "text-fuchsia-300")}>{fmtMult(done)}</div>
              <div className="text-sm font-black text-white/60">{boom ? "a bomba encerrou a rodada" : "rodada completa!"}</div>
            </div>
          </motion.div>
        )}
      </div>
      <Footer>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>LANÇAR · {fmt(bet)}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
