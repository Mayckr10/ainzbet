/**
 * Kit de desenho dos slots temáticos (viewBox 0 0 100 100).
 * Cada símbolo leva os próprios gradientes com IDs únicos, então pode ser rasterizado isoladamente.
 */
import type { ReactNode } from "react";

export const lin = (id: string, stops: string[], vertical = true) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "1"}>
    {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
  </linearGradient>
);
export const rad = (id: string, stops: string[], cx = "38%", cy = "32%") => (
  <radialGradient id={id} cx={cx} cy={cy} r="72%">
    {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
  </radialGradient>
);

export const GOLD = ["#fff6d0", "#f7c955", "#c8860f", "#ffdf7e"];

/** Contorno com sombra (o "corpo" padrão dos símbolos). */
export function Sym({ id, defs, children }: { id: string; defs?: ReactNode; children: ReactNode }) {
  return (
    <g>
      <defs>
        <filter id={`${id}-sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#000" floodOpacity=".55" />
        </filter>
        {lin(`${id}-gold`, GOLD)}
        {defs}
      </defs>
      <g filter={`url(#${id}-sh)`}>{children}</g>
    </g>
  );
}

/** Faixa de texto (WILD / FREE / BÔNUS) no rodapé do símbolo. */
export function Ribbon({ id, text, colors = ["#fde68a", "#d97706"], ink = "#3b1d00", y = 74 }: { id: string; text: string; colors?: string[]; ink?: string; y?: number }) {
  return (
    <g>
      <defs>{lin(`${id}-rb`, colors)}</defs>
      <path d={`M10 ${y} L90 ${y} L84 ${y + 10} L90 ${y + 20} L10 ${y + 20} L16 ${y + 10} Z`} fill={`url(#${id}-rb)`} stroke="#fff7d6" strokeWidth="1.5" />
      <text x="50" y={y + 15.5} textAnchor="middle" fontFamily="Unbounded, sans-serif" fontWeight="900" fontSize="13" fill={ink} letterSpacing=".5">{text}</text>
    </g>
  );
}

/** Símbolo baixo: medalhão com borda dourada, cor própria e um glifo do tema. */
export function Badge({ id, colors, glyph, shape = "hex" }: { id: string; colors: [string, string, string]; glyph: ReactNode; shape?: "hex" | "circle" | "shield" | "diamond" }) {
  const outline =
    shape === "circle" ? <circle cx="50" cy="50" r="38" /> :
    shape === "shield" ? <path d="M50 10 L84 22 L80 62 C76 78 62 88 50 92 C38 88 24 78 20 62 L16 22 Z" /> :
    shape === "diamond" ? <path d="M50 8 L90 50 L50 92 L10 50 Z" /> :
    <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" />;
  return (
    <Sym id={id} defs={rad(`${id}-bg`, colors)}>
      <g fill={`url(#${id}-bg)`} stroke={`url(#${id}-gold)`} strokeWidth="5">{outline}</g>
      <g opacity=".22" fill="#fff">
        {shape === "circle" ? <ellipse cx="42" cy="34" rx="20" ry="10" /> : <path d="M50 14 L80 31 L50 46 L20 31 Z" />}
      </g>
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{glyph}</g>
    </Sym>
  );
}

/** Moldura circular dourada para retratos (personagens, animais). */
export function Medallion({ id, bg, children, ring = true }: { id: string; bg: [string, string, string]; children: ReactNode; ring?: boolean }) {
  return (
    <Sym id={id} defs={<>{rad(`${id}-mb`, bg, "50%", "40%")}<clipPath id={`${id}-clip`}><circle cx="50" cy="50" r="40" /></clipPath></>}>
      <circle cx="50" cy="50" r="44" fill={`url(#${id}-mb)`} stroke={ring ? `url(#${id}-gold)` : "none"} strokeWidth="5" />
      <g clipPath={`url(#${id}-clip)`}>{children}</g>
    </Sym>
  );
}
