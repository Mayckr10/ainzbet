import type { ReactNode } from "react";

/** Renderiza um símbolo SVG (viewBox 100x100) de qualquer tema. */
export function SymbolArt({ art, size = "100%", className, children }: { art: ReactNode; size?: number | string; className?: string; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={{ overflow: "visible" }}>
      {art}
      {children}
    </svg>
  );
}
