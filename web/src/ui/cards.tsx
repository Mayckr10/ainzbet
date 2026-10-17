import { motion } from "framer-motion";
import { useEffect } from "react";
import { cls } from "../lib/format";
import { sfx } from "../lib/sound";
import { speedFactor } from "../lib/store";

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const SUITS = ["♠", "♥", "♦", "♣"];
const RED = (s: number) => s === 1 || s === 2;

type CardProps = {
  card: number; // -1 = virada para baixo
  index?: number;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  dim?: boolean;
  held?: boolean;
  /** de onde a carta "sai" (sapato no canto superior direito por padrão) */
  from?: { x: number; y: number };
  delay?: number;
  onClick?: () => void;
};

const SIZES = { sm: "w-[46px] h-[66px] rounded-[7px]", md: "w-[58px] h-[84px] rounded-[9px]", lg: "w-[64px] h-[92px] rounded-[10px]" };

/** Carta de baralho com animação de distribuição (desliza do sapato) e virada 3D. */
export function PlayingCard({ card, index = 0, size = "md", highlight, dim, held, from = { x: 160, y: -220 }, delay = 0, onClick }: CardProps) {
  const sf = speedFactor();
  const faceUp = card >= 0;
  const d = (delay + index * 0.12) * sf;
  useEffect(() => {
    const t = setTimeout(() => sfx.card(), d * 1000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (faceUp && index >= 0) {
      const t = setTimeout(() => sfx.flip(), (d + 0.25 * sf) * 1000);
      return () => clearTimeout(t);
    }
  }, [faceUp]);
  return (
    <motion.div
      onClick={onClick}
      initial={{ x: from.x, y: from.y, rotate: 25, opacity: 0, scale: 0.7 }}
      animate={{ x: 0, y: held ? -10 : 0, rotate: 0, opacity: dim ? 0.45 : 1, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 260, delay: d }}
      className={cls("relative shrink-0 [perspective:600px]", SIZES[size], onClick && "cursor-pointer")}
    >
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        initial={{ rotateY: 180 }}
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ duration: 0.45 * sf, delay: faceUp ? d + 0.22 * sf : 0, ease: [0.3, 1.4, 0.5, 1] }}
      >
        <CardFace card={card} className={cls(SIZES[size], highlight && "ring-2 ring-gold-400 shadow-[0_0_18px_rgba(245,196,81,0.7)]")} size={size} />
        <CardBack className={SIZES[size]} />
      </motion.div>
      {held && <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-black text-gold-300 tracking-wider">SEGURAR</div>}
    </motion.div>
  );
}

function CardFace({ card, className, size }: { card: number; className: string; size: "sm" | "md" | "lg" }) {
  if (card < 0) return <div className={cls("absolute inset-0 [backface-visibility:hidden] bg-white", className)} />;
  const r = RANKS[card % 13];
  const s = Math.floor(card / 13);
  const color = RED(s) ? "text-[#d61f45]" : "text-[#16132b]";
  const big = size === "sm" ? "text-[22px]" : "text-[30px]";
  return (
    <div className={cls("absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-white to-[#ece9f7] shadow-[0_6px_14px_rgba(0,0,0,0.45)] overflow-hidden", className)}>
      <div className={cls("absolute top-1 left-1.5 leading-none font-extrabold flex flex-col items-center", color)}>
        <span className={size === "sm" ? "text-[13px]" : "text-[15px]"}>{r}</span>
        <span className={size === "sm" ? "text-[11px]" : "text-[13px]"}>{SUITS[s]}</span>
      </div>
      <div className={cls("absolute inset-0 grid place-items-center", color, big)}>{SUITS[s]}</div>
      <div className={cls("absolute bottom-1 right-1.5 leading-none font-extrabold flex flex-col items-center rotate-180", color)}>
        <span className={size === "sm" ? "text-[13px]" : "text-[15px]"}>{r}</span>
        <span className={size === "sm" ? "text-[11px]" : "text-[13px]"}>{SUITS[s]}</span>
      </div>
    </div>
  );
}

function CardBack({ className }: { className: string }) {
  return (
    <div
      className={cls("absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden border-2 border-white/90 shadow-[0_6px_14px_rgba(0,0,0,0.45)]", className)}
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(245,196,81,0.9) 0 9%, transparent 10%), repeating-conic-gradient(from 0deg at 50% 50%, #3b1d8f 0 10deg, #24135e 10deg 20deg), #2a1670",
      }}
    >
      <div className="absolute inset-1.5 rounded-[5px] border border-gold-400/50" />
    </div>
  );
}

/** Sapato decorativo (de onde as cartas saem). */
export function Shoe() {
  return (
    <div className="absolute right-3 top-2 w-14 h-10 rounded-lg bg-gradient-to-b from-space-600 to-space-800 border border-white/10 shadow-lg">
      <div className="absolute -left-1 top-1.5 w-10 h-7 rounded-md bg-[#2a1670] border border-white/70 rotate-[-8deg]" />
    </div>
  );
}
