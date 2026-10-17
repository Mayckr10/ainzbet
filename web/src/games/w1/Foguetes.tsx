import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, ShareLink, usePersist } from "./common";

const ROCKETS = [
  { name: "Cometa", color: "#38bdf8", p: 0.4 },
  { name: "Fênix", color: "#f97316", p: 0.3 },
  { name: "Nebulosa", color: "#a855f7", p: 0.2 },
  { name: "Supernova", color: "#facc15", p: 0.1 },
];
const multOf = (p: number) => Math.floor((0.97 / p) * 100 + 1e-9) / 100;

function Rocket({ color, flame }: { color: string; flame: boolean }) {
  return (
    <svg viewBox="0 0 120 50" className="w-[64px] h-[27px] drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]">
      {flame && (
        <motion.path d="M22 25 L0 16 L8 25 L0 34 Z" fill="#fb923c" animate={{ scaleX: [1, 1.4, 0.9, 1.3] }} transition={{ repeat: Infinity, duration: 0.25 }} style={{ originX: "22px" }} />
      )}
      <path d="M22 14 H78 Q108 18 116 25 Q108 32 78 36 H22 Z" fill="#f8fafc" />
      <path d="M78 14 Q108 18 116 25 Q108 32 78 36 Z" fill={color} />
      <path d="M26 14 L16 4 H36 L46 14 Z M26 36 L16 46 H36 L46 36 Z" fill={color} />
      <circle cx="64" cy="25" r="6" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="2" />
    </svg>
  );
}

export default function Foguetes() {
  const [bet, setBet] = useBet("foguetes");
  const [pick, setPick] = usePersist("rr_p", 0);
  const [race, setRace] = useState<{ order: number[]; pace: number[][]; key: number } | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setWinner(null);
    setRace(null);
    haptic.impact("medium");
    const r = await playInstant<{ order: number[]; winner: number; pace: number[][]; win: boolean }>("foguetes", bet, { rocket: pick });
    if (!r) return setBusy(false);
    for (const c of [3, 2, 1]) {
      setCountdown(c);
      sfx.tick();
      await sleep(380 * speedFactor());
    }
    setCountdown(null);
    sfx.spinStart();
    setRace({ order: r.result.order, pace: r.result.pace, key: Date.now() });
    await sleep(4300 * speedFactor());
    setWinner(r.result.winner);
    if (r.result.win) setLastId(r.roundId);
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const total = 4 * speedFactor();

  return (
    <GameShell
      title="Corrida de Foguetes"
      game="foguetes"
      bg="radial-gradient(100% 60% at 50% 0%, rgba(59,130,246,0.3), transparent 70%), linear-gradient(180deg,#050816,#020308)"
      info={<><p>Quatro foguetes disputam a corrida até a estação espacial. Aposte no vencedor: os favoritos pagam menos, os azarões pagam mais.</p><p>Chances: Cometa 40% (2,42x) · Fênix 30% (3,23x) · Nebulosa 20% (4,85x) · Supernova 10% (9,7x). RTP 97%.</p></>}
    >
      <div className="relative flex-1 min-h-0 mx-3 my-2 rounded-3xl overflow-hidden border border-white/10" style={{ background: "radial-gradient(circle at 80% 20%, #1e3a8a 0, #0b1023 45%, #03040a 100%)" }}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(1px 1px at 10% 20%, #fff, transparent), radial-gradient(1px 1px at 30% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 60% 40%, #fff, transparent), radial-gradient(1px 1px at 80% 80%, #fff, transparent), radial-gradient(1px 1px at 90% 10%, #fff, transparent), radial-gradient(1px 1px at 45% 15%, #fff, transparent)" }} />
        {/* linha de chegada */}
        <div className="absolute top-0 bottom-0 right-[8%] w-2" style={{ backgroundImage: "repeating-linear-gradient(180deg,#fff 0 8px,#111 8px 16px)" }} />
        <div className="absolute inset-y-4 left-0 right-0 flex flex-col justify-around">
          {ROCKETS.map((rk, i) => {
            const place = race ? race.order.indexOf(i) : -1;
            const finishT = [1, 1.07, 1.13, 1.2][Math.max(0, place)];
            const pace = race?.pace[i] ?? [1, 1, 1, 1, 1];
            // tempos acumulados de cada trecho (normalizados para a chegada deste foguete)
            const cum = pace.reduce<number[]>((a, x) => [...a, (a[a.length - 1] ?? 0) + 1 / x], []);
            const T = cum[cum.length - 1];
            const times = [0, ...cum.map((c) => ((c / T) * finishT) / 1.2)];
            const xs = ["0%", "20%", "40%", "60%", "80%", "100%", "100%"];
            return (
              <div key={i} className={cls("relative h-12 border-y border-white/5", winner === i && "bg-gold-400/10")}>
                <span className="absolute left-2 top-0.5 text-[9px] font-black text-white/45 z-10">{rk.name} · {fmtMult(multOf(rk.p))}</span>
                <div className="absolute top-3 left-1" style={{ right: "calc(8% + 60px)" }}>
                  <motion.div
                    key={race?.key ?? "idle"}
                    className="absolute top-0"
                    initial={{ left: "0%" }}
                    animate={race ? { left: xs } : { left: "0%" }}
                    transition={race ? { duration: total * 1.2, times: [...times, 1], ease: "easeInOut" } : undefined}
                  >
                    <Rocket color={rk.color} flame={!!race && winner == null} />
                  </motion.div>
                </div>
                {winner != null && place >= 0 && <span className={cls("absolute right-[10%] top-1/2 -translate-y-1/2 mr-2 text-xs font-black", place === 0 ? "text-gold-300" : "text-white/40")}>{place + 1}º</span>}
              </div>
            );
          })}
        </div>
        {countdown != null && (
          <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 grid place-items-center font-display font-black text-7xl">
            {countdown}
          </motion.div>
        )}
        {winner != null && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-3 inset-x-0 text-center font-display font-black text-xl" style={{ color: ROCKETS[winner].color }}>
            {ROCKETS[winner].name} venceu!
          </motion.div>
        )}
      </div>
      <Footer>
        <div className="grid grid-cols-4 gap-1.5">
          {ROCKETS.map((rk, i) => (
            <button key={i} disabled={busy} onClick={() => { setPick(i); haptic.tap(); sfx.click(); }} className={cls("press rounded-2xl py-2 border-2 text-center", pick === i ? "bg-white/10" : "border-transparent glass")} style={{ borderColor: pick === i ? rk.color : undefined }}>
              <div className="text-[10px] font-black" style={{ color: rk.color }}>{rk.name}</div>
              <div className="font-extrabold text-sm tabular">{fmtMult(multOf(rk.p))}</div>
              <div className="text-[9px] text-white/40 font-bold">{rk.p * 100}%</div>
            </button>
          ))}
        </div>
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={go}>LARGADA · {ROCKETS[pick].name} paga {fmt(bet * multOf(ROCKETS[pick].p))}</Btn>
        <ShareLink id={lastId} />
      </Footer>
    </GameShell>
  );
}
