import { motion } from "framer-motion";
import { cls } from "../lib/format";
import { haptic } from "../lib/tg";
import { nav, useRoute } from "../nav";
import { StarIcon } from "../ui/kit";

export function BottomNav() {
  const route = useRoute();
  const item = (name: "lobby" | "ranking" | "store" | "profile", label: string, icon: React.ReactNode) => {
    const active = route.name === name || (name === "profile" && (route.name === "settings" || route.name === "fair"));
    return (
      <button
        onClick={() => {
          haptic.tap();
          if (name === "lobby") nav.push({ name: "lobby" });
          else nav.replace({ name } as any);
        }}
        className={cls("press flex-1 flex flex-col items-center gap-0.5 py-1.5", active ? "text-white" : "text-white/45")}
      >
        <div className="h-6 grid place-items-center">{icon}</div>
        <span className="text-[10px] font-extrabold">{label}</span>
      </button>
    );
  };
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 8px)" }}>
      <div className="glass rounded-[22px] flex items-end px-1 relative">
        {item("lobby", "Cassino", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>)}
        {item("ranking", "Ranking", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>)}
        <button
          onClick={() => {
            haptic.impact("medium");
            nav.replace({ name: "store" });
          }}
          className="press flex-1 flex flex-col items-center -mt-6"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, repeatDelay: 1.2 }}
            className="w-14 h-14 rounded-2xl btn-gold grid place-items-center pulse-glow shine"
          >
            <StarIcon size={30} />
          </motion.div>
          <span className="text-[10px] font-black text-gold-300 mt-1">LOJA</span>
        </button>
        {item("profile", "Perfil", <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>)}
        <button onClick={() => { haptic.tap(); nav.replace({ name: "settings" }); }} className={cls("press flex-1 flex flex-col items-center gap-0.5 py-1.5", route.name === "settings" ? "text-white" : "text-white/45")}>
          <div className="h-6 grid place-items-center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg></div>
          <span className="text-[10px] font-extrabold">Ajustes</span>
        </button>
      </div>
    </nav>
  );
}
