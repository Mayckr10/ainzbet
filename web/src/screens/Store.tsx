import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt, fmtCompact, sleep, timeLeft } from "../lib/format";
import { sfx } from "../lib/sound";
import { refreshUser, useApp } from "../lib/store";
import { haptic, onBackButton, openInvoice } from "../lib/tg";
import { nav } from "../nav";
import { coinBurst, confetti } from "../ui/effects";
import { errorMessage } from "../ui/GameShell";
import { Avatar, BalancePill, Btn, ChipIcon, Sheet, Spinner, StarIcon, TierBadge, toast } from "../ui/kit";
import { BottomNav } from "./BottomNav";
import { Brand } from "../ui/Brand";

type Pack = { id: string; stars: number; chips: number; bonusPct: number; title: string; badge?: string };
type StoreData = {
  packs: Pack[];
  vip: { id: string; stars: number; days: number; title: string; chips: number };
  vipBonusMult: number;
  donations: number[];
  donationChipsPerStar: number;
  firstPurchaseMult: number;
  deal: { packId: string; endsAt: number; bonus: number; claimed: boolean };
  tiers: { name: string; min: number }[];
  me: { firstPurchase: boolean; vip: { until: number } | null; supporter: { stars: number; tier: string | null } };
};

export default function Store() {
  const [data, setData] = useState<StoreData | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [custom, setCustom] = useState(false);
  const [customAmt, setCustomAmt] = useState(100);
  const [, tick] = useState(0);
  const user = useApp((s) => s.user)!;

  const load = () => api.get<StoreData>("/store").then(setData).catch((e) => toast(errorMessage(e), "error"));
  useEffect(() => {
    load();
    api.get("/leaderboard?scope=supporters").then((r) => setSupporters(r.rows.slice(0, 10))).catch(() => {});
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => onBackButton(() => nav.push({ name: "lobby" })), []);

  async function buy(productId: string, el?: HTMLElement | null) {
    if (buying) return;
    setBuying(productId);
    haptic.impact("medium");
    try {
      const { link } = await api.post<{ link: string }>("/store/invoice", { productId });
      const status = await openInvoice(link);
      if (status === "paid") {
        sfx.jackpot();
        haptic.success();
        confetti();
        coinBurst(el ?? null, 28);
        toast(productId.startsWith("donate_") ? "Muito obrigado pelo apoio! 💖" : "Compra concluída! ✨", "success");
        // o crédito chega pelo webhook do bot; consulta algumas vezes
        for (let i = 0; i < 5; i++) {
          await sleep(1200);
          await refreshUser();
        }
        load();
      } else if (status === "failed") toast("Pagamento não concluído", "error");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
    setBuying(null);
  }

  if (!data) {
    return (
      <div className="fixed inset-0 nebula-bg grid place-items-center">
        <Spinner />
        <BottomNav />
      </div>
    );
  }

  const deal = data.packs.find((p) => p.id === data.deal.packId)!;
  const first = data.me.firstPurchase;
  const chipsFor = (p: Pack) => Math.floor(p.chips * (p.id === deal.id && !data.deal.claimed ? 1 + data.deal.bonus : 1) * (first ? data.firstPurchaseMult : 1));

  return (
    <div className="fixed inset-0 overflow-y-auto no-scrollbar" style={{ background: "radial-gradient(80% 40% at 50% 0%, rgba(245,196,81,0.22), transparent 70%), radial-gradient(60% 30% at 0% 40%, rgba(124,58,237,0.25), transparent 70%), #07060f" }}>
      <div className="stars-layer fixed" />
      <div className="relative px-4 pb-36" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2"><StarIcon size={22} /><span className="font-display font-black text-xl gold-text">LOJA</span></div>
            <div className="text-[11px] text-white/50 font-bold mt-0.5">Pagamento seguro com Telegram Stars</div>
          </div>
          <BalancePill />
        </div>

        {/* primeira compra */}
        {first && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mt-4 rounded-3xl p-4 overflow-hidden shine" style={{ background: "linear-gradient(120deg, #7c2d12, #ea580c 40%, #f59e0b 70%, #fde68a)" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute -right-12 -top-12 w-44 h-44 rounded-full opacity-40" style={{ background: "conic-gradient(#fff, transparent 30%, #fff 50%, transparent 80%)" }} />
            <div className="relative">
              <div className="text-[11px] font-black tracking-[0.25em] text-[#3b1500]/80">BÔNUS DE BOAS-VINDAS</div>
              <div className="font-display font-black text-[34px] leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)] mt-1">FICHAS EM DOBRO</div>
              <div className="text-sm font-bold text-[#2a1000] mt-1.5">Na sua primeira compra, qualquer pacote vem com <b>2x fichas</b>.</div>
            </div>
          </motion.div>
        )}

        {/* oferta do dia */}
        <div className="mt-4 rounded-3xl gold-border p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black tracking-widest text-gold-300">OFERTA DO DIA · +{Math.round(data.deal.bonus * 100)}%</div>
            <div className="text-[11px] font-black text-white/70 tabular">{data.deal.claimed ? "Resgatada hoje ✓" : `Troca em ${timeLeft(data.deal.endsAt)}`}</div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <ChestArt size={74} glow />
            <div className="flex-1">
              <div className="font-extrabold text-white/80 text-sm">{deal.title}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-2xl gold-text">{fmt(chipsFor(deal))}</span>
                {(!data.deal.claimed || first) && <span className="text-xs text-white/40 line-through tabular">{fmt(deal.chips)}</span>}
              </div>
              <div className="text-[11px] text-white/50 font-bold">fichas</div>
            </div>
            <Btn variant="gold" size="lg" onClick={() => buy(deal.id, document.activeElement as HTMLElement)} disabled={!!buying} className="shine">
              <StarIcon size={18} /> {deal.stars}
            </Btn>
          </div>
        </div>

        {/* VIP */}
        <div className="mt-4 rounded-3xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1408, #3b2a0a 50%, #1c1408)", border: "1px solid rgba(245,196,81,0.4)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "repeating-linear-gradient(45deg, transparent 0 14px, rgba(245,196,81,0.08) 14px 15px)" }} />
          <div className="relative flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl btn-gold grid place-items-center text-3xl shine">👑</div>
            <div className="flex-1">
              <div className="font-display font-black text-lg gold-text leading-tight">Passe Estelar VIP</div>
              <ul className="text-[11.5px] text-white/75 font-bold mt-1 space-y-0.5">
                <li>✦ Bônus diário {data.vipBonusMult}x por {data.vip.days} dias</li>
                <li>✦ Nome dourado e selo VIP no ranking</li>
                <li>✦ +{fmt(data.vip.chips)} fichas na hora</li>
              </ul>
            </div>
          </div>
          <Btn variant="gold" size="lg" className="relative w-full mt-3 shine" onClick={() => buy(data.vip.id)} disabled={!!buying}>
            {data.me.vip ? `Renovar (ativo até ${new Date(data.me.vip.until).toLocaleDateString("pt-BR")})` : "Ativar VIP"} · <StarIcon size={18} /> {data.vip.stars}
          </Btn>
        </div>

        {/* pacotes */}
        <div className="mt-6 mb-2 flex items-center justify-between">
          <div className="font-display font-bold text-base">Pacotes de fichas</div>
          {first && <span className="text-[10px] font-black text-orange-300">2x NA 1ª COMPRA</span>}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {data.packs.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              disabled={!!buying}
              onClick={(e) => buy(p.id, e.currentTarget)}
              className={cls("relative rounded-3xl p-3 pt-4 text-center overflow-hidden", p.badge ? "gold-border" : "glass")}
            >
              {p.badge && <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-gold-500 to-gold-300 text-[#3b2300] text-[9.5px] font-black py-0.5 tracking-wider">{p.badge.toUpperCase()}</div>}
              {p.bonusPct > 0 && <div className="absolute top-5 right-2 rounded-lg bg-win-500 text-space-950 text-[10px] font-black px-1.5 py-0.5">+{p.bonusPct}%</div>}
              <div className={cls("mx-auto", p.badge ? "mt-3" : "mt-1")}><ChestArt size={56 + i * 4} glow={i >= 3} /></div>
              <div className="text-[11px] font-bold text-white/60 mt-1">{p.title}</div>
              <div className="font-display font-black text-lg gold-text leading-tight">{fmtCompact(chipsFor(p))}</div>
              {first && <div className="text-[10px] text-white/35 line-through tabular">{fmtCompact(p.chips)}</div>}
              <div className="mt-2 h-9 rounded-xl btn-gold flex items-center justify-center gap-1.5 font-black text-sm">
                {buying === p.id ? <Spinner className="w-4 h-4" /> : <><StarIcon size={16} /> {fmt(p.stars)}</>}
              </div>
            </motion.button>
          ))}
        </div>

        {/* doação */}
        <div className="mt-7 rounded-3xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #4a044e, #1e1b4b)", border: "1px solid rgba(244,114,182,0.35)" }}>
          <div className="flex items-center gap-2">
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-2xl">💖</motion.span>
            <div>
              <div className="font-display font-black text-lg text-pink-200">Apoie o <Brand size={18} /></div>
              <div className="text-[11.5px] text-white/65 font-bold">Cada estrela mantém o cassino no ar e com jogos novos.</div>
            </div>
          </div>
          <div className="text-[11px] text-pink-200/80 font-bold mt-2">Você ganha {data.donationChipsPerStar} fichas por estrela + selo de apoiador ({data.tiers.slice().reverse().map((t) => `${t.name} ${t.min}⭐`).join(" · ")}).</div>
          {data.me.supporter.tier && (
            <div className="mt-2 text-xs font-bold text-white/80">Seu nível: <TierBadge tier={data.me.supporter.tier} /> · {fmt(data.me.supporter.stars)} ⭐ no total</div>
          )}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {data.donations.map((a) => (
              <button key={a} disabled={!!buying} onClick={(e) => buy(`donate_${a}`, e.currentTarget)} className="press h-14 rounded-2xl bg-white/10 border border-white/10 flex flex-col items-center justify-center">
                <span className="flex items-center gap-1 font-black text-sm"><StarIcon size={14} />{fmt(a)}</span>
                <span className="text-[9px] font-bold text-white/45">+{fmtCompact(a * data.donationChipsPerStar)}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setCustom(true)} className="press mt-2 w-full h-10 rounded-xl bg-pink-400/15 text-pink-200 text-xs font-black">Outro valor</button>
        </div>

        {/* mural */}
        {supporters.length > 0 && (
          <div className="mt-6">
            <div className="font-display font-bold text-base mb-2">Mural de apoiadores</div>
            <div className="glass rounded-3xl p-2">
              {supporters.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-2 py-2">
                  <div className={cls("w-6 text-center font-display font-black", i === 0 ? "text-gold-300" : i < 3 ? "text-white/80" : "text-white/40")}>{i + 1}</div>
                  <Avatar name={s.name} photo={s.photo} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className={cls("text-sm font-extrabold truncate", s.vip && "gold-text")}>{s.name}</div>
                    <TierBadge tier={s.tier} vip={s.vip} />
                  </div>
                  <div className="flex items-center gap-1 font-black text-sm"><StarIcon size={14} />{fmt(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-white/35 leading-relaxed">
          Fichas são moeda virtual de entretenimento, sem valor monetário, e não podem ser sacadas ou trocadas por dinheiro ou prêmios.
          Compras via Telegram Stars. Dúvidas: /paysupport no bot. Proibido para menores de 18 anos.
        </p>
      </div>

      <Sheet open={custom} onClose={() => setCustom(false)} title="Doar outro valor">
        <div className="pb-6">
          <div className="flex items-center gap-2 glass rounded-2xl px-4 h-14">
            <StarIcon size={22} />
            <input type="number" inputMode="numeric" value={customAmt} onChange={(e) => setCustomAmt(Math.max(1, Math.min(10000, Math.floor(Number(e.target.value)) || 1)))} className="bg-transparent outline-none flex-1 font-display font-black text-2xl" />
          </div>
          <div className="text-xs text-white/50 mt-2">Você recebe {fmt(customAmt * data.donationChipsPerStar)} fichas de agradecimento.</div>
          <Btn variant="gold" size="lg" className="w-full mt-4" onClick={() => { setCustom(false); buy(`donate_${customAmt}`); }}>Doar {fmt(customAmt)} ⭐</Btn>
        </div>
      </Sheet>
      <BottomNav />
    </div>
  );
}

/** Baú de fichas (arte própria). */
function ChestArt({ size = 60, glow }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={glow ? "drop-shadow-[0_0_14px_rgba(245,196,81,0.7)]" : ""}>
      <ellipse cx="50" cy="44" rx="30" ry="12" fill="#fde68a" opacity=".55" />
      {[[34, 38], [50, 34], [64, 38], [42, 30], [58, 30]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y + 2} rx="9" ry="4" fill="#a16207" />
          <ellipse cx={x} cy={y} rx="9" ry="4" fill="url(#a-gold)" />
        </g>
      ))}
      <path d="M16 46 L84 46 L80 86 L20 86 Z" fill="#7c2d12" stroke="url(#a-gold)" strokeWidth="3" />
      <path d="M16 46 L84 46 L84 58 L16 58 Z" fill="#9a3412" />
      <rect x="16" y="56" width="68" height="5" fill="url(#a-gold)" />
      <rect x="44" y="52" width="12" height="16" rx="2" fill="url(#a-gold)" stroke="#78350f" strokeWidth="1.5" />
      <circle cx="50" cy="60" r="2.4" fill="#78350f" />
    </svg>
  );
}
