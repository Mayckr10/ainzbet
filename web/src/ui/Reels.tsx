import { animate, motion, useMotionValue } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { cls, sleep } from "../lib/format";
import { sfx } from "../lib/sound";
import { haptic } from "../lib/tg";
import { speedFactor } from "../lib/store";

export type ReelsHandle = {
  /** Começa a girar todos os rolos (antes do resultado chegar). */
  start(): void;
  /** Para os rolos em sequência no resultado. Resolve quando o último parar. */
  stop(final: number[][], opts?: { anticipate?: number[]; only?: number[] }): Promise<void>;
  /** Troca símbolos sem animação de giro (efeitos como "vira Wild"). */
  setGrid(grid: number[][]): void;
};

type Props = {
  reels: number;
  rows: number;
  initial: number[][];
  pool: number[];
  renderSymbol: (sym: number, reel: number, row: number) => ReactNode;
  cellOverlay?: (reel: number, row: number) => ReactNode;
  highlight?: Set<string> | null;
  cellClass?: string;
  frameClass?: string;
  gap?: number;
  aspect?: number; // altura/largura da célula
  children?: ReactNode; // camadas por cima (linhas de pagamento)
};

const randomOf = (pool: number[]) => pool[(Math.random() * pool.length) | 0];

export const Reels = forwardRef<ReelsHandle, Props>(function Reels(
  { reels, rows, initial, pool, renderSymbol, cellOverlay, highlight, cellClass, frameClass, gap = 6, aspect = 1, children },
  ref,
) {
  const [grid, setGrid] = useState(initial);
  const [spinning, setSpinning] = useState<boolean[]>(() => Array(reels).fill(false));
  const stopFns = useRef<((final: number[], extraDelay: number) => Promise<void>)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState({ w: 60, h: 60 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      let w = (W - gap * (reels - 1)) / reels;
      let h = w * aspect;
      const maxH = (H - gap * (rows - 1)) / rows;
      if (h > maxH) {
        h = maxH;
        w = h / aspect;
      }
      setCell({ w: Math.floor(w), h: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [reels, rows, gap, aspect]);

  useImperativeHandle(ref, () => ({
    start() {
      setSpinning(Array(reels).fill(true));
      sfx.spinStart();
    },
    async stop(final, opts) {
      const sf = speedFactor();
      const only = opts?.only;
      const ant = new Set(opts?.anticipate ?? []);
      const order = Array.from({ length: reels }, (_, i) => i).filter((i) => !only || only.includes(i));
      let delay = 0;
      const promises: Promise<void>[] = [];
      for (const [k, r] of order.entries()) {
        delay += k === 0 ? 260 * sf : 170 * sf;
        if (ant.has(r)) {
          delay += 1300 * sf;
          setTimeout(() => sfx.anticipation(), Math.max(0, delay - 1250 * sf));
        }
        const d = delay;
        promises.push(
          (async () => {
            await sleep(d);
            await stopFns.current[r]?.(final[r], 0);
            setGrid((g) => g.map((col, i) => (i === r ? final[r] : col)));
            setSpinning((s) => s.map((v, i) => (i === r ? false : v)));
            sfx.reelStop(r);
            haptic.impact("light");
          })(),
        );
      }
      await Promise.all(promises);
    },
    setGrid(g) {
      setGrid(g);
    },
  }));

  return (
    <div ref={wrap} className={cls("relative w-full h-full flex items-center justify-center", frameClass)}>
      <div className="relative flex" style={{ gap }}>
        {Array.from({ length: reels }).map((_, r) => (
          <Reel
            key={r}
            index={r}
            rows={rows}
            cell={cell}
            gap={gap}
            symbols={grid[r]}
            pool={pool}
            spinning={spinning[r]}
            register={(fn) => (stopFns.current[r] = fn)}
            renderSymbol={renderSymbol}
            cellOverlay={cellOverlay}
            highlight={highlight}
            cellClass={cellClass}
          />
        ))}
        {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}
      </div>
    </div>
  );
});

function Reel({
  index, rows, cell, gap, symbols, pool, spinning, register, renderSymbol, cellOverlay, highlight, cellClass,
}: {
  index: number; rows: number; cell: { w: number; h: number }; gap: number; symbols: number[]; pool: number[]; spinning: boolean;
  register: (fn: (final: number[], extra: number) => Promise<void>) => void;
  renderSymbol: Props["renderSymbol"]; cellOverlay?: Props["cellOverlay"]; highlight?: Set<string> | null; cellClass?: string;
}) {
  const y = useMotionValue(0);
  const [strip, setStrip] = useState<number[] | null>(null);
  const loopRef = useRef<ReturnType<typeof animate> | null>(null);
  const step = cell.h + gap;
  const FILL = 14;

  // giro contínuo (borrado) enquanto espera o resultado
  useEffect(() => {
    if (!spinning) return;
    const s = [...Array.from({ length: rows }, () => randomOf(pool)), ...Array.from({ length: FILL }, () => randomOf(pool))];
    setStrip(s);
    y.set(-FILL * step);
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      y.set(-FILL * step);
      loopRef.current = animate(y, -FILL * step + 8 * step, { duration: 0.42 * speedFactor() + 0.08, ease: "linear", onComplete: loop });
    };
    loop();
    return () => {
      cancelled = true;
      loopRef.current?.stop();
    };
  }, [spinning, step]);

  useEffect(() => {
    register(async (final) => {
      loopRef.current?.stop();
      const s = [...final, ...Array.from({ length: FILL }, () => randomOf(pool))];
      setStrip(s);
      y.set(-FILL * step);
      const sf = speedFactor();
      await animate(y, [-FILL * step, step * 0.16, 0], { duration: 0.55 * sf + 0.12, times: [0, 0.82, 1], ease: ["easeOut", "easeInOut"] });
      setStrip(null);
    });
  });

  const box = { width: cell.w, height: rows * cell.h + (rows - 1) * gap };
  return (
    <div className="relative overflow-hidden" style={box}>
      {strip ? (
        <motion.div style={{ y, filter: spinning ? "blur(1.2px)" : undefined }} className="absolute left-0 right-0 top-0 flex flex-col" >
          {strip.map((s, i) => (
            <div key={i} style={{ height: cell.h, marginBottom: gap }} className={cls("relative grid place-items-center", cellClass)}>
              <div style={{ width: cell.w * 0.86, height: cell.h * 0.86 }}>{renderSymbol(s, index, i)}</div>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex flex-col" style={{ gap }}>
          {symbols.map((s, row) => {
            const key = `${index}-${row}`;
            const hl = highlight?.has(key);
            const dim = highlight && highlight.size > 0 && !hl;
            return (
              <div key={row} style={{ height: cell.h }} className={cls("relative grid place-items-center transition-opacity duration-300", cellClass, dim && "opacity-35")}>
                <motion.div
                  key={`${s}-${row}`}
                  initial={false}
                  animate={hl ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                  transition={hl ? { repeat: Infinity, duration: 0.9 } : { duration: 0.2 }}
                  style={{ width: cell.w * 0.86, height: cell.h * 0.86 }}
                  className={hl ? "drop-shadow-[0_0_12px_rgba(253,224,71,0.85)]" : ""}
                >
                  {renderSymbol(s, index, row)}
                </motion.div>
                {cellOverlay?.(index, row)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Linhas de pagamento desenhadas por cima da grade. */
export function Paylines({ lines, active, reels, rows, colors }: { lines: number[][]; active: number[]; reels: number; rows: number; colors?: string[] }) {
  const palette = colors ?? ["#fde047", "#f472b6", "#22d3ee", "#a78bfa", "#4ade80", "#fb923c"];
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${reels * 100} ${rows * 100}`} preserveAspectRatio="none">
      {active.map((li, k) => {
        const pts = lines[li].map((row, reel) => `${reel * 100 + 50},${row * 100 + 50}`).join(" ");
        return (
          <motion.polyline
            key={`${li}-${k}`}
            points={pts}
            fill="none"
            stroke={palette[k % palette.length]}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 6px ${palette[k % palette.length]})` }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: k * 0.08 }}
          />
        );
      })}
    </svg>
  );
}
