import { motion } from "framer-motion";
import { useState } from "react";
import { cls, fmt, fmtMult, sleep } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { speedFactor } from "../../lib/store";
import { haptic } from "../../lib/tg";
import { GameShell, playInstant } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { Chips, finishFx, Footer, ShareLink, usePersist } from "./common";

const BICHOS = [
  ["Avestruz", "🦤"], ["Águia", "🦅"], ["Burro", "🫏"], ["Borboleta", "🦋"], ["Cachorro", "🐕"],
  ["Cabra", "🐐"], ["Carneiro", "🐏"], ["Camelo", "🐫"], ["Cobra", "🐍"], ["Coelho", "🐇"],
  ["Cavalo", "🐎"], ["Elefante", "🐘"], ["Galo", "🐓"], ["Gato", "🐈"], ["Jacaré", "🐊"],
  ["Leão", "🦁"], ["Macaco", "🐒"], ["Porco", "🐖"], ["Pavão", "🦚"], ["Peru", "🦃"],
  ["Touro", "🐂"], ["Tigre", "🐅"], ["Urso", "🐻"], ["Veado", "🦌"], ["Vaca", "🐄"],
];
const MODES = [
  { value: "grupo", label: "Grupo", pay: 24, digits: 0 },
  { value: "grupo15", label: "1º ao 5º", pay: 5.2, digits: 0 },
  { value: "dezena", label: "Dezena", pay: 96, digits: 2 },
  { value: "centena", label: "Centena", pay: 960, digits: 3 },
  { value: "milhar", label: "Milhar", pay: 9600, digits: 4 },
];
const dezenas = (g: number) => [1, 2, 3, 4].map((k) => String((g - 1) * 4 + k === 100 ? 0 : (g - 1) * 4 + k).padStart(2, "0"));
const groupOf = (d: number) => (d === 0 ? 25 : Math.ceil(d / 4));

export default function Bicho() {
  const [bet, setBet] = useBet("bicho");
  const [mode, setMode] = usePersist("bicho_m", "grupo");
  const [group, setGroup] = usePersist("bicho_g", 16);
  const [num, setNum] = usePersist("bicho_n", "1234");
  const [busy, setBusy] = useState(false);
  const [prizes, setPrizes] = useState<(number | null)[]>([null, null, null, null, null]);
  const [res, setRes] = useState<{ win: boolean; payout: number; id: number } | null>(null);
  const M = MODES.find((m) => m.value === mode)!;
  const digits = M.digits;
  const value = digits ? Number(num.slice(-digits).padStart(digits, "0")) : group;
  const shownNum = digits ? num.slice(-digits).padStart(digits, "0") : "";

  function key(d: string) {
    haptic.tap();
    sfx.click();
    if (d === "<") setNum(("0" + num).slice(0, -1).slice(-4));
    else setNum((num + d).slice(-4));
  }

  async function play() {
    if (busy) return;
    setBusy(true);
    setRes(null);
    setPrizes([null, null, null, null, null]);
    haptic.impact("medium");
    const r = await playInstant<{ prizes: number[]; groups: number[]; win: boolean }>("bicho", bet, { mode, value });
    if (!r) return setBusy(false);
    for (let i = 0; i < 5; i++) {
      await sleep(550 * speedFactor());
      setPrizes((p) => p.map((x, j) => (j === i ? r.result.prizes[i] : x)));
      sfx.ball();
    }
    setRes({ win: r.result.win, payout: r.payout, id: r.roundId });
    await finishFx(r.payout, bet);
    setBusy(false);
  }

  const isHit = (m: number, i: number) => {
    if (mode === "grupo") return i === 0 && groupOf(m % 100) === value;
    if (mode === "grupo15") return groupOf(m % 100) === value;
    if (mode === "dezena") return i === 0 && m % 100 === value;
    if (mode === "centena") return i === 0 && m % 1000 === value;
    return i === 0 && m === value;
  };

  return (
    <GameShell
      title="Jogo do Bicho"
      game="bicho"
      bg="radial-gradient(80% 50% at 50% 0%, rgba(132,204,22,0.25), transparent 70%), linear-gradient(180deg,#0b1405,#040802)"
      info={<><p>Versão com fichas virtuais do sorteio tradicional: saem 5 milhares (1º ao 5º prêmio). Os dois últimos dígitos de cada milhar indicam a dezena, e cada grupo de 4 dezenas é um bicho (01-04 Avestruz … 97-00 Vaca).</p><p>Grupo na cabeça 24x · Grupo do 1º ao 5º 5,2x · Dezena 96x · Centena 960x · Milhar 9.600x (todas na cabeça = 1º prêmio, exceto "1º ao 5º"). RTP ≈ 96%.</p></>}
    >
      <div className="px-3 pt-1">
        <div className="rounded-2xl overflow-hidden border border-lime-300/20 bg-black/30">
          {prizes.map((p, i) => {
            const g = p != null ? groupOf(p % 100) : null;
            return (
              <div key={i} className={cls("flex items-center gap-2 px-3 py-1 text-sm border-b border-white/5 last:border-0", p != null && isHit(p, i) && "bg-gold-400/25")}>
                <span className="w-7 text-[11px] font-black text-white/45">{i + 1}º</span>
                <motion.span key={String(p)} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} className="font-display font-black tabular tracking-widest w-16">{p != null ? String(p).padStart(4, "0") : "····"}</motion.span>
                <span className="flex-1 text-right font-bold text-white/80">{g ? `${BICHOS[g - 1][1]} ${BICHOS[g - 1][0]} (${g})` : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-2">
        {digits === 0 ? (
          <div className="grid grid-cols-5 gap-1.5">
            {BICHOS.map(([name, e], i) => (
              <button key={name} disabled={busy} onClick={() => { setGroup(i + 1); haptic.tap(); sfx.click(); }} className={cls("press rounded-xl py-1 flex flex-col items-center border", group === i + 1 ? "bg-lime-500/30 border-lime-300" : "bg-white/[0.04] border-white/5")}>
                <span className="text-2xl leading-tight">{e}</span>
                <span className="text-[9px] font-black text-white/80 leading-tight">{name}</span>
                <span className="text-[8px] text-white/40 font-bold">{i + 1} · {dezenas(i + 1).join(" ")}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {shownNum.split("").map((d, i) => <div key={i} className="w-12 h-14 rounded-xl bg-black/40 border-2 border-lime-300/40 grid place-items-center font-display font-black text-3xl">{d}</div>)}
            </div>
            <div className="text-[11px] font-bold text-white/50">{BICHOS[groupOf(value % 100) - 1][1]} {BICHOS[groupOf(value % 100) - 1][0]} · grupo {groupOf(value % 100)}</div>
            <div className="grid grid-cols-3 gap-1.5 w-56">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "?", "0", "<"].map((d) => (
                <button key={d} disabled={busy} onClick={() => (d === "?" ? setNum(String(Math.floor(Math.random() * 10000)).padStart(4, "0")) : key(d))} className="press h-10 rounded-xl glass font-black">{d === "?" ? "🎲" : d === "<" ? "⌫" : d}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer>
        <Chips value={mode} onChange={setMode} disabled={busy} options={MODES.map((m) => ({ value: m.value, label: m.label }))} />
        <BetInput value={bet} onChange={setBet} disabled={busy} />
        <Btn variant="gold" size="lg" pulse={!busy} disabled={busy} onClick={play}>
          JOGAR {digits ? shownNum : BICHOS[group - 1][0].toUpperCase()} · paga {fmtMult(M.pay)}
        </Btn>
        {res && <div className={cls("text-center font-black text-sm", res.win ? "text-win-400" : "text-white/50")}>{res.win ? `Deu ${digits ? shownNum : BICHOS[group - 1][0]}! +${fmt(res.payout)}` : "Não foi dessa vez"}</div>}
        <ShareLink id={res?.win && !busy ? res.id : null} />
      </Footer>
    </GameShell>
  );
}
