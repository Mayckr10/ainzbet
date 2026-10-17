import { motion } from "framer-motion";
import { cls, fmtMult } from "../../lib/format";
import { sfx } from "../../lib/sound";
import { haptic } from "../../lib/tg";
import { GameShell } from "../../ui/GameShell";
import { BetInput, Btn, useBet } from "../../ui/kit";
import { finishFx, Footer, money, ShareLink, useHist, useSession } from "./common";

type View = { phase: "pick" | "decide" | "done"; pick?: number; opened?: number; final?: number; switched?: boolean; prize?: number; win?: boolean };
const MULT = 1.47;
const COLORS = [
  ["#f43f5e", "#9f1239"],
  ["#3b82f6", "#1e3a8a"],
  ["#22c55e", "#14532d"],
];

function Box({ i, open, full, chosen, dim }: { i: number; open: boolean; full?: boolean; chosen?: boolean; dim?: boolean }) {
  const [a, b] = COLORS[i];
  return (
    <motion.div className={cls("relative w-full aspect-square", dim && "opacity-40")} animate={{ y: chosen && !open ? -10 : 0 }}>
      {open && full && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-x-0 -top-6 text-center text-3xl">💰</motion.div>}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id={`bx${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        <rect x="12" y="36" width="76" height="56" rx="6" fill={`url(#bx${i})`} stroke="#fff" strokeOpacity=".4" strokeWidth="2" />
        <rect x="45" y="36" width="10" height="56" fill="#fde047" />
        {open ? (
          <g transform="rotate(-28 14 30)">
            <rect x="8" y="22" width="84" height="16" rx="4" fill={a} stroke="#fff" strokeOpacity=".4" strokeWidth="2" />
            <rect x="45" y="22" width="10" height="16" fill="#fde047" />
          </g>
        ) : (
          <>
            <rect x="8" y="24" width="84" height="16" rx="4" fill={a} stroke="#fff" strokeOpacity=".4" strokeWidth="2" />
            <rect x="45" y="24" width="10" height="16" fill="#fde047" />
            <path d="M50 24 C 38 8, 26 14, 36 24 M50 24 C 62 8, 74 14, 64 24" stroke="#fde047" strokeWidth="5" fill="none" />
          </>
        )}
        {open && !full && <text x="50" y="72" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff" opacity=".7">VAZIA</text>}
        {open && full && <text x="50" y="72" textAnchor="middle" fontSize="15" fontWeight="900" fill="#fef08a">{MULT}x</text>}
      </svg>
      {chosen && <div className="absolute -bottom-5 inset-x-0 text-center text-[10px] font-black text-gold-300">SUA</div>}
    </motion.div>
  );
}

export default function Caixas() {
  const [bet, setBet] = useBet("caixas");
  const S = useSession<View>("caixas");
  const [stats, pushStat] = useHist("caixas", 40);
  const v = S.round?.view;
  const active = S.active;
  const phase = v?.phase ?? "idle";

  async function pick(b: number) {
    if (!active || phase !== "pick") return;
    haptic.impact("light");
    const r = await S.act("pick", { box: b });
    if (r) sfx.flip();
  }
  async function final(sw: boolean) {
    haptic.impact("medium");
    const r = await S.act("final", { switch: sw });
    if (!r) return;
    pushStat(sw ? 1 : 0, !!r.view.win);
    await finishFx(r.payout, bet);
  }

  const swWins = stats.filter((s) => s.v === 1 && s.win).length;
  const swTotal = stats.filter((s) => s.v === 1).length;
  const kpWins = stats.filter((s) => s.v === 0 && s.win).length;
  const kpTotal = stats.filter((s) => s.v === 0).length;

  return (
    <GameShell
      title="Escolha a Caixa"
      game="caixas"
      bg="radial-gradient(80% 50% at 50% 10%, rgba(244,63,94,0.3), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgba(59,130,246,0.3), transparent 70%), linear-gradient(180deg,#160a1c,#07040c)"
      info={<><p>O clássico problema de Monty Hall. Uma das 3 caixas tem o prêmio de {MULT}x. Você escolhe uma; o apresentador, que sabe onde está o prêmio, abre uma caixa vazia entre as outras duas. Então você decide: manter ou trocar.</p><p>Quem troca ganha 2 em cada 3 vezes (RTP 98%). Quem mantém ganha só 1 em 3. A matemática surpreende!</p></>}
    >
      <div className="px-4 pt-2 text-center">
        <div className="font-display font-black text-lg">
          {phase === "pick" ? "Escolha uma caixa" : phase === "decide" ? "Vai trocar ou manter?" : phase === "done" ? (v!.win ? `Ganhou ${money(bet, MULT)}!` : "A caixa estava vazia") : "Uma caixa, um prêmio"}
        </div>
        <div className="text-xs text-white/50 font-bold mt-0.5">{phase === "decide" ? `O apresentador abriu a caixa ${v!.opened! + 1}: vazia.` : `Prêmio: ${fmtMult(MULT)} a aposta`}</div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4">
        <div className="grid grid-cols-3 gap-4 w-full max-w-[380px]">
          {[0, 1, 2].map((i) => {
            const open = (phase === "decide" && v!.opened === i) || phase === "done";
            const full = phase === "done" && v!.prize === i;
            const chosen = phase === "done" ? v!.final === i : v?.pick === i;
            return (
              <button key={i} className="press" onClick={() => pick(i)}>
                <Box i={i} open={open} full={full} chosen={chosen && active !== false} dim={phase === "done" && !chosen && !full} />
                <div className="mt-6 text-[11px] font-black text-white/40">CAIXA {i + 1}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-3 pb-1 grid grid-cols-2 gap-2 text-center text-[10px] font-black text-white/45">
        <div className="glass rounded-xl py-1.5">TROCANDO <span className="text-win-400">{swWins}/{swTotal}</span></div>
        <div className="glass rounded-xl py-1.5">MANTENDO <span className="text-white/80">{kpWins}/{kpTotal}</span></div>
      </div>
      <Footer>
        {phase === "decide" ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="violet" size="xl" disabled={S.busy} onClick={() => final(false)}>MANTER</Btn>
            <Btn variant="gold" size="xl" disabled={S.busy} onClick={() => final(true)}>TROCAR</Btn>
          </div>
        ) : phase === "pick" ? (
          <div className="glass rounded-2xl h-14 grid place-items-center text-sm font-black text-white/70">TOQUE EM UMA CAIXA</div>
        ) : (
          <>
            <BetInput value={bet} onChange={setBet} />
            <Btn variant="gold" size="lg" pulse disabled={S.busy} onClick={() => S.start(bet)}>JOGAR · prêmio {fmtMult(MULT)}</Btn>
            <ShareLink id={S.lastWin} />
          </>
        )}
      </Footer>
    </GameShell>
  );
}
