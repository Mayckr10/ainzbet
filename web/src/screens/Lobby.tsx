import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GAMES, GAME_ICONS, type GameMeta } from "../art/gameIcons";
import { SymbolArt } from "../art/Symbol";
import { COSMIC_ART } from "../art/cosmic";
import { api } from "../lib/api";
import { cls, fmt, fmtCompact, timeLeft } from "../lib/format";
import { sfx } from "../lib/sound";
import { setUser, useApp } from "../lib/store";
import { haptic, onBackButton, shareMessage } from "../lib/tg";
import { nav } from "../nav";
import { coinBurst } from "../ui/effects";
import { errorMessage } from "../ui/GameShell";
import { Avatar, BalancePill, Btn, ChipIcon, StarIcon, TierBadge, toast } from "../ui/kit";
import { BottomNav } from "./BottomNav";
import { Brand, BrandLogo } from "../ui/Brand";

const CATS = [
  { id: "all", label: "Todos" },
  { id: "slots", label: "Slots" },
  { id: "originals", label: "Originais" },
  { id: "table", label: "Roleta" },
  { id: "cards", label: "Cartas" },
  { id: "lottery", label: "Sorteios" },
] as const;

export default function Lobby({ openBonus }: { openBonus?: boolean }) {
  const user = useApp((s) => s.user)!;
  const ctx = useApp((s) => s.context);
  const cfgNames = useApp((s) => s.config?.games ?? {});
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("all");
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
      coinBurst(el, 20);
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

  const list = GAMES.filter((g) => cat === "all" || g.cat === cat);
  const bonusReady = user.bonus.available;

  return (
    <div className="fixed inset-0 nebula-bg overflow-y-auto no-scrollbar">
      <div className="stars-layer fixed" />
      <div className="relative px-4 pb-32" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <BrandLogo size={26} className="rounded-lg" />
          <Brand size={20} />
        </div>
        {/* topo */}
        <div className="flex items-center gap-3">
          <button onClick={() => nav.replace({ name: "profile" })} className="press">
            <Avatar name={user.name} photo={user.photo} size={40} ring={user.vip ? "ring-2 ring-gold-400" : "ring-1 ring-white/15"} />
          </button>
          <div className="flex-1 min-w-0">
            <div className={cls("font-extrabold text-sm truncate", user.vip && "gold-text")}>{user.name}</div>
            <TierBadge tier={user.supporter.tier} vip={!!user.vip} />
            {!user.supporter.tier && !user.vip && <div className="text-[11px] text-white/45 font-bold">{ctx.inGroup ? "Jogando no grupo" : "Bem-vindo ao AinzBet"}</div>}
          </div>
          <BalancePill onClick={() => nav.replace({ name: "store" })} />
        </div>

        {/* destaque */}
        <motion.button
          onClick={() => nav.push({ name: "game", id: "cosmic" })}
          whileTap={{ scale: 0.98 }}
          className="relative mt-4 w-full h-[168px] rounded-[26px] overflow-hidden text-left"
          style={{ background: "linear-gradient(120deg, #2e1065 0%, #4c1d95 45%, #0e7490 100%)" }}
        >
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full spin-slow opacity-60" style={{ background: "conic-gradient(transparent, #f472b688, transparent 30%, #22d3ee88, transparent 60%)" }} />
          <motion.div animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute right-2 top-3 w-36 h-36">
            <SymbolArt art={COSMIC_ART[11]} />
          </motion.div>
          <div className="absolute right-28 bottom-3 w-14 h-14 opacity-90"><SymbolArt art={COSMIC_ART[12]} /></div>
          <div className="relative p-5 h-full flex flex-col justify-between">
            <div>
              <div className="inline-block rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-black tracking-widest text-gold-300">NOVO · SLOT EXCLUSIVO</div>
              <div className="font-display font-black text-[26px] leading-[0.95] mt-2 gold-text">ORÁCULO<br />CÓSMICO</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="btn-gold rounded-xl px-4 h-9 inline-flex items-center font-black text-sm shine">JOGAR</span>
              <span className="text-xs font-extrabold text-white/80">até 50.000x</span>
            </div>
          </div>
        </motion.button>

        {/* bônus */}
        <div id="bonus-card" className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={(e) => bonusReady && claim("daily", e.currentTarget)}
            className={cls("press relative rounded-2xl p-3 text-left overflow-hidden", bonusReady ? "gold-border pulse-glow" : "glass")}
          >
            <div className="text-[10px] font-black tracking-widest text-gold-300/90">BÔNUS DIÁRIO {user.vip && "· VIP 5x"}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <ChipIcon size={20} />
              <span className="font-display font-black text-lg">{fmt(user.bonus.daily)}</span>
            </div>
            <div className={cls("text-[11px] font-extrabold mt-1", bonusReady ? "text-win-400" : "text-white/45")}>{bonusReady ? "Toque para resgatar" : `Volta em ${timeLeft(user.bonus.availableAt)}`}</div>
          </button>
          <button onClick={() => nav.replace({ name: "store" })} className="press relative rounded-2xl p-3 text-left overflow-hidden shine" style={{ background: "linear-gradient(135deg, #b45309, #f59e0b 50%, #fde68a)" }}>
            <div className="text-[10px] font-black tracking-widest text-[#3b2300]/80">{user.store.firstPurchase ? "1ª COMPRA EM DOBRO" : "OFERTA DO DIA +50%"}</div>
            <div className="flex items-center gap-1.5 mt-1 text-[#2a1700]">
              <StarIcon size={20} />
              <span className="font-display font-black text-lg">Loja</span>
            </div>
            <div className="text-[11px] font-extrabold text-[#3b2300] mt-1">Fichas, VIP e apoio ⭐</div>
          </button>
        </div>
        {user.bonus.rescueAvailable && (
          <button onClick={(e) => claim("rescue", e.currentTarget)} className="press mt-3 w-full glass rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm font-extrabold">🛟 Saldo baixo? Pegue {fmt(user.bonus.rescue)} fichas grátis</span>
            <span className="text-win-400 font-black text-sm">Resgatar</span>
          </button>
        )}

        {/* vitórias ao vivo */}
        {feed.length > 0 && (
          <div className="mt-4 glass rounded-2xl py-2 overflow-hidden">
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-win-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-white/60">VITÓRIAS AO VIVO</span>
            </div>
            <div className="relative overflow-hidden">
              <motion.div className="flex gap-2 w-max px-3" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: Math.max(20, feed.length * 3), ease: "linear" }}>
                {[...feed, ...feed].map((w, i) => (
                  <div key={i} className="shrink-0 flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-1.5">
                    <div className="w-7 h-7"><SymbolArt art={GAME_ICONS[w.game]} /></div>
                    <div className="leading-tight">
                      <div className="text-[11px] font-bold text-white/70 max-w-[90px] truncate">{w.name}</div>
                      <div className="text-xs font-black text-win-400">+{fmtCompact(w.payout)}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        )}

        {/* categorias */}
        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                haptic.tap();
                setCat(c.id);
              }}
              className={cls("press shrink-0 h-9 px-4 rounded-full text-xs font-extrabold", cat === c.id ? "btn-violet" : "glass text-white/70")}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* jogos */}
        <motion.div layout className="mt-4 grid grid-cols-3 gap-2.5">
          <AnimatePresence mode="popLayout">
            {list.map((g, i) => (
              <GameTile key={g.id} game={g} name={cfgNames[g.id] ?? g.name} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* grupo */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Btn variant="glass" size="lg" onClick={() => nav.replace({ name: "ranking" })}>🏆 Ranking{ctx.inGroup ? " do grupo" : ""}</Btn>
          <Btn variant="violet" size="lg" onClick={invite}>📣 Convidar</Btn>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/35 leading-relaxed">
          Jogo de entretenimento para maiores de 18 anos.<br />Fichas virtuais sem valor monetário e sem resgate.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

function GameTile({ game, name, index }: { game: GameMeta; name: string; index: number }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index, 12) * 0.025 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        haptic.impact("light");
        sfx.click();
        nav.push({ name: "game", id: game.id });
      }}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden text-left border border-white/10"
      style={{ background: `linear-gradient(160deg, ${game.colors[0]}, ${game.colors[1]})` }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(80% 60% at 50% 30%, rgba(255,255,255,0.14), transparent 70%)" }} />
      <div className="absolute inset-x-2 top-3 bottom-10 grid place-items-center">
        <div className="w-[78%] aspect-square"><SymbolArt art={GAME_ICONS[game.id]} /></div>
      </div>
      {game.max && <div className="absolute top-1.5 right-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-black text-gold-300">{game.max}</div>}
      <div className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="text-[11.5px] font-extrabold leading-tight">{name}</div>
      </div>
    </motion.button>
  );
}
