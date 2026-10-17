import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GAMES, GAME_ICONS, type GameMeta } from "../art/gameIcons";
import { SymbolArt } from "../art/Symbol";
import { COSMIC_ART } from "../art/cosmic";
import { ABYSS_ART } from "../art/abyss";
import { FORGE_ART } from "../art/forge";
import { api } from "../lib/api";
import { cls, fmt, fmtCompact, timeLeft } from "../lib/format";
import { sfx } from "../lib/sound";
import { setUser, useApp } from "../lib/store";
import { haptic, onBackButton, shareMessage } from "../lib/tg";
import { nav } from "../nav";
import { coinBurst } from "../ui/effects";
import { errorMessage } from "../ui/GameShell";
import { Avatar, BalancePill, ChipIcon, StarIcon, TierBadge, toast } from "../ui/kit";
import { BottomNav } from "./BottomNav";
import { Brand, BrandLogo } from "../ui/Brand";

const SECTIONS: { id: GameMeta["cat"]; title: string; sub: string }[] = [
  { id: "slots", title: "Slots exclusivos", sub: "13 slots com arte própria · até 50.000x" },
  { id: "originals", title: "Originais AinzBet", sub: "Rodadas rápidas e verificáveis" },
  { id: "table", title: "Roletas", sub: "Mesa clássica" },
  { id: "cards", title: "Cartas", sub: "Blackjack, bacará e pôquer" },
  { id: "lottery", title: "Sorteios", sub: "Keno, raspadinha e bingo" },
];

const RIBBON: Record<string, { text: string; cls: string }> = {
  cosmic: { text: "NOVO", cls: "bg-gradient-to-r from-fuchsia-500 to-violet-500" },
  crash: { text: "AO VIVO", cls: "bg-gradient-to-r from-emerald-500 to-green-600" },
  "slots-fruit": { text: "BÔNUS", cls: "bg-gradient-to-r from-cyan-500 to-sky-600" },
  "vs-farao": { text: "NOVO", cls: "bg-gradient-to-r from-fuchsia-500 to-violet-500" },
  "vs-olimpo": { text: "NOVO", cls: "bg-gradient-to-r from-fuchsia-500 to-violet-500" },
  "vs-savana": { text: "NOVO", cls: "bg-gradient-to-r from-fuchsia-500 to-violet-500" },
  mines: { text: "HOT", cls: "bg-gradient-to-r from-orange-500 to-red-500" },
  plinko: { text: "HOT", cls: "bg-gradient-to-r from-orange-500 to-red-500" },
};

export default function Lobby({ openBonus }: { openBonus?: boolean }) {
  const user = useApp((s) => s.user)!;
  const ctx = useApp((s) => s.context);
  const cfgNames = useApp((s) => s.config?.games ?? {});
  const [feed, setFeed] = useState<any[]>([]);
  const [, tick] = useState(0);
  useEffect(() => onBackButton(null), []);
  useEffect(() => {
    const load = () => api.get("/feed").then((r) => setFeed(r.wins)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    const t2 = setInterval(() => tick((x) => x + 1), 1000);
    return () => {
      clearInterval(t);
      clearInterval(t2);
    };
  }, []);
  useEffect(() => {
    if (openBonus) document.getElementById("bonus-card")?.scrollIntoView({ behavior: "smooth" });
  }, [openBonus]);

  async function claim(kind: "daily" | "rescue", el: HTMLElement | null) {
    try {
      const r = await api.post("/bonus", { kind });
      sfx.win(true);
      haptic.success();
      coinBurst(el, 22);
      setTimeout(() => setUser(r.user), 700);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  async function invite() {
    try {
      const { id } = await api.post<{ id: string }>("/share", {});
      if (await shareMessage(id)) toast("Convite enviado! 🎉", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  }

  const bonusReady = user.bonus.available;

  return (
    <div className="fixed inset-0 nebula-bg overflow-y-auto no-scrollbar">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="aurora" /></div>
      <div className="stars-layer fixed" />
      <div className="relative pb-32" style={{ paddingTop: "calc(var(--safe-top) + 10px)" }}>
        {/* topo */}
        <div className="px-4 flex items-center gap-2.5">
          <BrandLogo size={34} className="rounded-xl ring-1 ring-gold-400/40" />
          <Brand size={21} />
          <div className="flex-1" />
          <BalancePill onClick={() => nav.replace({ name: "store" })} />
        </div>
        <button onClick={() => nav.replace({ name: "profile" })} className="press mx-4 mt-3 w-[calc(100%-2rem)] flex items-center gap-3 rounded-2xl px-3 py-2 bg-white/[0.04] border border-white/[0.07]">
          <Avatar name={user.name} photo={user.photo} size={34} ring={user.vip ? "ring-2 ring-gold-400" : "ring-1 ring-white/15"} />
          <div className="flex-1 min-w-0 text-left">
            <div className={cls("font-extrabold text-[13px] truncate", user.vip && "gold-text")}>{user.name}</div>
            <div className="flex items-center gap-1.5">
              <TierBadge tier={user.supporter.tier} vip={!!user.vip} />
              <span className="text-[10.5px] text-white/45 font-bold truncate">{ctx.inGroup ? "Jogando com o grupo" : "Bem-vindo ao AinzBet"}</span>
            </div>
          </div>
          <span className={cls("rounded-full px-2.5 py-1 text-[10px] font-black", bonusReady ? "btn-gold" : "bg-white/5 text-white/45")}>{bonusReady ? "🎁 BÔNUS PRONTO" : `🎁 ${timeLeft(user.bonus.availableAt)}`}</span>
        </button>

        {/* carrossel */}
        <Hero firstPurchase={user.store.firstPurchase} />

        {/* bônus */}
        <div id="bonus-card" className="px-4 mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={(e) => bonusReady && claim("daily", e.currentTarget)}
            className={cls("press relative rounded-2xl p-3 text-left overflow-hidden", bonusReady ? "gold-border pulse-glow" : "tile-frame")}
          >
            <div className="absolute -right-4 -bottom-5 text-[64px] opacity-15 rotate-12">🎁</div>
            <div className="text-[10px] font-black tracking-widest text-gold-300/90">BÔNUS DIÁRIO {user.vip && "· VIP 5x"}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <ChipIcon size={20} />
              <span className="font-display font-black text-lg">{fmt(user.bonus.daily)}</span>
            </div>
            <div className={cls("text-[11px] font-extrabold mt-1", bonusReady ? "text-win-400" : "text-white/45")}>{bonusReady ? "Toque para resgatar" : `Volta em ${timeLeft(user.bonus.availableAt)}`}</div>
          </button>
          <button onClick={() => nav.replace({ name: "store" })} className="press relative rounded-2xl p-3 text-left overflow-hidden shine" style={{ background: "linear-gradient(135deg, #92400e, #f59e0b 55%, #fde68a)" }}>
            <div className="absolute -right-3 -bottom-4 opacity-30 rotate-12"><StarIcon size={70} /></div>
            <div className="text-[10px] font-black tracking-widest text-[#3b2300]/80">{user.store.firstPurchase ? "1ª COMPRA EM DOBRO" : "OFERTA DO DIA +50%"}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[#2a1700]">
              <StarIcon size={20} />
              <span className="font-display font-black text-lg">Loja</span>
            </div>
            <div className="text-[11px] font-extrabold text-[#3b2300] mt-1">Fichas, VIP e apoio</div>
          </button>
        </div>
        {user.bonus.rescueAvailable && (
          <button onClick={(e) => claim("rescue", e.currentTarget)} className="press mx-4 mt-3 w-[calc(100%-2rem)] tile-frame rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm font-extrabold">🛟 Saldo baixo? Pegue {fmt(user.bonus.rescue)} fichas grátis</span>
            <span className="text-win-400 font-black text-sm">Resgatar</span>
          </button>
        )}

        {/* vitórias ao vivo */}
        {feed.length > 0 && (
          <div className="mt-4 mx-4 rounded-2xl py-2 overflow-hidden bg-black/30 border border-white/[0.06]">
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-win-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-white/60">VITÓRIAS AO VIVO</span>
            </div>
            <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
              <motion.div className="flex gap-2 w-max px-3" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: Math.max(20, feed.length * 3), ease: "linear" }}>
                {[...feed, ...feed].map((w, i) => (
                  <div key={i} className="shrink-0 flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-1.5">
                    <div className="w-7 h-7"><SymbolArt art={GAME_ICONS[w.game]} /></div>
                    <div className="leading-tight">
                      <div className={cls("text-[11px] font-bold max-w-[90px] truncate", w.vip ? "gold-text" : "text-white/70")}>{w.name}</div>
                      <div className="text-xs font-black text-win-400">+{fmtCompact(w.payout)}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* seções */}
        {SECTIONS.map((sec) => {
          const games = GAMES.filter((g) => g.cat === sec.id);
          const big = sec.id === "slots";
          return (
            <section key={sec.id} className="mt-6">
              <div className="px-4 flex items-end justify-between mb-2.5">
                <div>
                  <div className="section-title">{sec.title}</div>
                  <div className="text-[11px] text-white/45 font-bold">{sec.sub}</div>
                </div>
                <span className="text-[11px] font-black text-white/35">{games.length} jogos</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-1">
                {games.map((g, i) => (
                  <GameTile key={g.id} game={g} name={cfgNames[g.id] ?? g.name} index={i} big={big} />
                ))}
              </div>
            </section>
          );
        })}

        {/* grupo */}
        <div className="px-4 mt-7 grid grid-cols-2 gap-3">
          <button onClick={() => nav.replace({ name: "ranking" })} className="press tile-frame rounded-2xl p-3 text-left">
            <div className="text-2xl">🏆</div>
            <div className="font-extrabold text-sm mt-1">Ranking{ctx.inGroup ? " do grupo" : ""}</div>
            <div className="text-[11px] text-white/45 font-bold">Quem está lucrando mais</div>
          </button>
          <button onClick={invite} className="press rounded-2xl p-3 text-left btn-violet">
            <div className="text-2xl">📣</div>
            <div className="font-extrabold text-sm mt-1">Convidar o grupo</div>
            <div className="text-[11px] text-white/70 font-bold">Compartilhe o cassino</div>
          </button>
        </div>

        <p className="mt-7 px-6 text-center text-[11px] text-white/30 leading-relaxed">
          Jogo de entretenimento para maiores de 18 anos.<br />Fichas virtuais sem valor monetário e sem resgate.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

/* ======================================================= carrossel do topo */
function Hero({ firstPurchase }: { firstPurchase: boolean }) {
  const slides = [
    {
      key: "cosmic",
      onClick: () => nav.push({ name: "game", id: "cosmic" }),
      bg: "linear-gradient(120deg, #2e1065 0%, #5b21b6 45%, #0e7490 100%)",
      kicker: "SLOT EXCLUSIVO",
      title: ["ORÁCULO", "CÓSMICO"],
      cta: "JOGAR",
      note: "até 50.000x",
      art: (
        <>
          <motion.div animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute right-1 top-2 w-36 h-36"><SymbolArt art={COSMIC_ART[11]} /></motion.div>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute right-[118px] bottom-2 w-14 h-14"><SymbolArt art={COSMIC_ART[12]} /></motion.div>
          <div className="absolute right-3 bottom-3 w-11 h-11 opacity-90"><SymbolArt art={COSMIC_ART[13]} /></div>
        </>
      ),
    },
    {
      key: "abyss",
      onClick: () => nav.push({ name: "game", id: "slots-fruit" }),
      bg: "linear-gradient(120deg, #082f49 0%, #0c4a6e 45%, #312e81 100%)",
      kicker: "GIROS GRÁTIS",
      title: ["JARDIM", "ABISSAL"],
      cta: "MERGULHAR",
      note: "Kraken até 500x",
      art: (
        <>
          <motion.div animate={{ x: [0, -10, 0], y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="absolute right-0 top-4 w-36 h-36"><SymbolArt art={ABYSS_ART[2]} /></motion.div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5 }} className="absolute right-[132px] top-3 w-12 h-12 opacity-90"><SymbolArt art={ABYSS_ART[3]} /></motion.div>
        </>
      ),
    },
    {
      key: "forge",
      onClick: () => nav.push({ name: "game", id: "slots-classic" }),
      bg: "linear-gradient(120deg, #450a0a 0%, #9a3412 55%, #b45309 100%)",
      kicker: "RODA DA SORTE",
      title: ["FORJA DO", "DRAGÃO"],
      cta: "GIRAR",
      note: "roda até 50.000x",
      art: <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2.4 }} className="absolute right-2 top-5 w-36 h-36"><SymbolArt art={FORGE_ART[1]} /></motion.div>,
    },
    {
      key: "store",
      onClick: () => nav.replace({ name: "store" }),
      bg: "linear-gradient(120deg, #78350f 0%, #d97706 50%, #fde68a 100%)",
      kicker: firstPurchase ? "BOAS-VINDAS" : "OFERTA DO DIA",
      title: firstPurchase ? ["FICHAS", "EM DOBRO"] : ["+50% DE", "FICHAS"],
      cta: "VER LOJA",
      note: "com Telegram Stars",
      dark: true,
      art: <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute right-6 top-6"><StarIcon size={110} /></motion.div>,
    },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5200);
    return () => clearInterval(t);
  }, [i]);
  const s = slides[i];
  return (
    <div className="px-4 mt-3">
      <div className="relative h-[176px] rounded-[26px] overflow-hidden ring-1 ring-white/10">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.button
            key={s.key}
            onClick={s.onClick}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) setI((x) => (x + 1) % slides.length);
              else if (info.offset.x > 40) setI((x) => (x - 1 + slides.length) % slides.length);
            }}
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="absolute inset-0 text-left"
            style={{ background: s.bg }}
          >
            <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full spin-slow opacity-50" style={{ background: "conic-gradient(transparent, #ffffff33, transparent 30%, #ffffff22, transparent 60%)" }} />
            {s.art}
            <div className="relative p-5 h-full flex flex-col justify-between">
              <div>
                <div className={cls("inline-block rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest", s.dark ? "bg-black/20 text-[#3b2300]" : "bg-black/30 text-gold-300")}>{s.kicker}</div>
                <div className={cls("font-display font-black text-[26px] leading-[0.95] mt-2", s.dark ? "text-[#2a1200]" : "gold-text")}>
                  {s.title[0]}
                  <br />
                  {s.title[1]}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cls("rounded-xl px-4 h-9 inline-flex items-center font-black text-sm shine", s.dark ? "bg-[#2a1200] text-gold-300" : "btn-gold")}>{s.cta}</span>
                <span className={cls("text-xs font-extrabold", s.dark ? "text-[#3b2300]" : "text-white/80")}>{s.note}</span>
              </div>
            </div>
          </motion.button>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {slides.map((x, k) => (
          <button key={x.key} onClick={() => setI(k)} className={cls("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-gold-400" : "w-1.5 bg-white/25")} />
        ))}
      </div>
    </div>
  );
}

/* ======================================================= cartão do jogo */
function GameTile({ game, name, index, big }: { game: GameMeta; name: string; index: number; big?: boolean }) {
  const ribbon = RIBBON[game.id];
  return (
    <motion.button
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        haptic.impact("light");
        sfx.click();
        nav.push({ name: "game", id: game.id });
      }}
      className={cls("relative shrink-0 snap-start rounded-[20px] overflow-hidden text-left tile-frame", big ? "w-[150px] h-[204px]" : "w-[112px] h-[150px]")}
      style={{ ["--tile-bg" as any]: game.colors[1] }}
    >
      <div className="absolute inset-0" style={{ background: `linear-gradient(165deg, ${game.colors[0]} 0%, ${game.colors[1]} 85%)` }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(70% 55% at 50% 32%, rgba(255,255,255,0.20), transparent 70%)" }} />
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 35% 75%, #fff 50%, transparent 51%)" }} />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3 + (index % 3) * 0.6, ease: "easeInOut" }}
        className={cls("absolute left-1/2 -translate-x-1/2", big ? "top-6 w-[112px] h-[112px]" : "top-4 w-[76px] h-[76px]")}
      >
        <SymbolArt art={GAME_ICONS[game.id]} />
      </motion.div>
      {ribbon && <div className={cls("absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-black text-white shadow", ribbon.cls)}>{ribbon.text}</div>}
      {game.max && <div className="absolute top-2 right-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-black text-gold-300 backdrop-blur-sm">{game.max}</div>}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className={cls("font-display font-bold leading-tight", big ? "text-[13px]" : "text-[11px]")}>{name}</div>
        {big && game.tag && <div className="text-[10px] font-bold text-white/60 mt-0.5">{game.tag}</div>}
      </div>
      <div className="absolute inset-0 shine pointer-events-none" />
    </motion.button>
  );
}
