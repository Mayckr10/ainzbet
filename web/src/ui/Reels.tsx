import { motion } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cls } from "../lib/format";
import { sfx } from "../lib/sound";
import { haptic } from "../lib/tg";
import { speedFactor } from "../lib/store";

/**
 * Motor dos rolos (usado por todos os slots).
 *
 * Cada rolo tem seu próprio laço de animação (requestAnimationFrame) com posição em "linhas",
 * convertida para pixels a cada quadro. Assim:
 *  - mudanças de tamanho da tela no meio do giro não quebram nada;
 *  - o pouso SEMPRE termina: além do rAF, um temporizador força o estado final
 *    (o rAF pausa quando o Telegram vai para segundo plano);
 *  - `start(only)` e `stop(only)` operam exatamente nos mesmos rolos.
 */
export type ReelsHandle = {
  /** Começa a girar (todos os rolos ou só os indicados). */
  start(only?: number[]): void;
  /** Para em sequência no resultado. Resolve quando o último rolo parar (garantido). */
  stop(final: number[][], opts?: { anticipate?: number[]; only?: number[] }): Promise<void>;
  /** "Parada rápida": encurta tudo o que falta (toque no botão durante o giro). */
  hurry(): void;
  /** Para tudo imediatamente no grid informado (recuperação de erro). */
  reset(grid: number[][]): void;
  /** Troca símbolos sem giro; células alteradas ganham animação de transformação. */
  setGrid(grid: number[][]): void;
  isSpinning(): boolean;
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
  /** cor do brilho da coluna em antecipação */
  anticipationColor?: string;
  children?: ReactNode;
};

const FILL = 18; // símbolos de enchimento na fita durante o giro
const randomOf = (pool: number[]) => pool[(Math.random() * pool.length) | 0];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type ReelCtl = {
  start(): void;
  land(final: number[], durationMs: number, onDone?: () => void): Promise<void>;
  hurry(): void;
  snap(final: number[]): void;
};

export const Reels = forwardRef<ReelsHandle, Props>(function Reels(
  { reels, rows, initial, pool, renderSymbol, cellOverlay, highlight, cellClass, frameClass, gap = 6, aspect = 1, anticipationColor = "#fde047", children },
  ref,
) {
  const [grid, setGridState] = useState(initial);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [anticipating, setAnticipating] = useState<Set<number>>(new Set());
  const ctls = useRef<ReelCtl[]>([]);
  const spinningCount = useRef(0);
  const hurried = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState({ w: 60, h: 60 });
  const gridRef = useRef(grid);
  gridRef.current = grid;

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      let w = (W - gap * (reels - 1)) / reels;
      let h = w * aspect;
      const maxH = (H - gap * (rows - 1)) / rows;
      if (h > maxH) {
        h = maxH;
        w = h / aspect;
      }
      setCell((c) => (Math.abs(c.w - w) < 0.5 && Math.abs(c.h - h) < 0.5 ? c : { w: Math.floor(w), h: Math.floor(h) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reels, rows, gap, aspect]);

  useImperativeHandle(ref, () => ({
    start(only) {
      const list = only ?? Array.from({ length: reels }, (_, i) => i);
      hurried.current = false;
      setChanged(new Set());
      for (const r of list) ctls.current[r]?.start();
      spinningCount.current = list.length;
      sfx.spinStart();
    },
    async stop(final, opts) {
      const sf = speedFactor();
      const order = Array.from({ length: reels }, (_, i) => i).filter((i) => !opts?.only || opts.only.includes(i));
      const ant = new Set(opts?.anticipate ?? []);
      let delay = 0;
      const jobs: Promise<void>[] = [];
      for (const [k, r] of order.entries()) {
        delay += k === 0 ? 220 * sf : 150 * sf;
        const isAnt = ant.has(r) && !hurried.current;
        if (isAnt) delay += 1250 * sf;
        const myDelay = delay;
        jobs.push(
          (async () => {
            // espera o atraso, mas sai na hora se o jogador pedir parada rápida
            const t0 = performance.now();
            if (isAnt) setTimeout(() => !hurried.current && (setAnticipating((s) => new Set(s).add(r)), sfx.anticipation()), Math.max(0, myDelay - 1250 * sf));
            while (performance.now() - t0 < myDelay && !hurried.current) await sleep(16);
            if (hurried.current) await sleep(k * 35);
            await ctls.current[r]?.land(final[r], hurried.current ? 160 : (isAnt ? 760 : 520) * sf + 120, () =>
              setGridState((g) => g.map((col, i) => (i === r ? final[r] : col))),
            );
            setAnticipating((s) => {
              if (!s.has(r)) return s;
              const n = new Set(s);
              n.delete(r);
              return n;
            });
            setGridState((g) => g.map((col, i) => (i === r ? final[r] : col)));
            sfx.reelStop(r);
            haptic.impact(isAnt ? "medium" : "light");
          })(),
        );
      }
      await Promise.all(jobs);
      spinningCount.current = 0;
      hurried.current = false;
    },
    hurry() {
      if (spinningCount.current > 0) hurried.current = true;
      for (const c of ctls.current) c?.hurry();
    },
    reset(g) {
      hurried.current = false;
      spinningCount.current = 0;
      setAnticipating(new Set());
      g.forEach((col, r) => ctls.current[r]?.snap(col));
      setGridState(g);
    },
    setGrid(g) {
      const diff = new Set<string>();
      g.forEach((col, r) => col.forEach((s, w) => s !== gridRef.current[r]?.[w] && diff.add(`${r}-${w}`)));
      setChanged(diff);
      setGridState(g);
    },
    isSpinning: () => spinningCount.current > 0,
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
            register={(c) => (ctls.current[r] = c)}
            renderSymbol={renderSymbol}
            cellOverlay={cellOverlay}
            highlight={highlight}
            changed={changed}
            cellClass={cellClass}
            anticipating={anticipating.has(r)}
            anticipationColor={anticipationColor}
          />
        ))}
        {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}
      </div>
    </div>
  );
});

function Reel({
  index, rows, cell, gap, symbols, pool, register, renderSymbol, cellOverlay, highlight, changed, cellClass, anticipating, anticipationColor,
}: {
  index: number; rows: number; cell: { w: number; h: number }; gap: number; symbols: number[]; pool: number[];
  register: (c: ReelCtl) => void; renderSymbol: Props["renderSymbol"]; cellOverlay?: Props["cellOverlay"];
  highlight?: Set<string> | null; changed: Set<string>; cellClass?: string; anticipating: boolean; anticipationColor: string;
}) {
  const [strip, setStrip] = useState<number[] | null>(null);
  const stripEl = useRef<HTMLDivElement>(null);
  const st = useRef({
    mode: "idle" as "idle" | "spin" | "land",
    pos: 0, // em linhas; pos = FILL mostra o topo da fita
    from: 0,
    to: FILL,
    t0: 0,
    dur: 500,
    raf: 0,
    resolve: null as null | (() => void),
    onDone: null as null | (() => void),
    timer: 0 as unknown as ReturnType<typeof setTimeout>,
    lastTick: 0,
  });
  const stepRef = useRef(cell.h + gap);
  stepRef.current = cell.h + gap;

  const apply = () => {
    const el = stripEl.current;
    if (el) el.style.transform = `translate3d(0, ${-(FILL - st.current.pos) * stepRef.current}px, 0)`;
  };

  const finish = () => {
    const s = st.current;
    cancelAnimationFrame(s.raf);
    clearTimeout(s.timer);
    s.mode = "idle";
    s.pos = FILL;
    apply();
    // atualiza o grid do pai e desmonta a fita no mesmo lote (sem piscar)
    const done = s.onDone;
    s.onDone = null;
    done?.();
    setStrip(null);
    const r = s.resolve;
    s.resolve = null;
    r?.();
  };

  const frame = (now: number) => {
    const s = st.current;
    if (s.mode === "spin") {
      // velocidade constante (linhas por ms), dando a volta na parte de enchimento
      const speed = 0.024 / Math.max(0.5, speedFactor());
      s.pos += speed * Math.min(48, now - (s.t0 || now));
      s.t0 = now;
      const span = FILL - rows - 1;
      if (s.pos >= span) s.pos -= span;
      if (now - s.lastTick > 85) {
        s.lastTick = now;
        if (index === 0) sfx.reelTick();
      }
      apply();
      s.raf = requestAnimationFrame(frame);
    } else if (s.mode === "land") {
      const t = Math.min(1, (now - s.t0) / s.dur);
      // easeOutBack: passa um pouco do ponto e volta (o "quique" do rolo)
      const c1 = 1.25;
      const c3 = c1 + 1;
      const e = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      s.pos = s.from + (s.to - s.from) * e;
      apply();
      if (t >= 1) finish();
      else s.raf = requestAnimationFrame(frame);
    }
  };

  useEffect(() => {
    register({
      start() {
        const s = st.current;
        cancelAnimationFrame(s.raf);
        clearTimeout(s.timer);
        if (s.resolve) {
          const r = s.resolve;
          s.resolve = null;
          r();
        }
        setStrip([...symbols, ...Array.from({ length: FILL }, () => randomOf(pool))]);
        s.mode = "spin";
        s.pos = 0;
        s.t0 = 0;
        s.raf = requestAnimationFrame(frame);
      },
      land(final, durationMs, onDone) {
        const s = st.current;
        return new Promise<void>((resolve) => {
          s.onDone = onDone ?? null;
          cancelAnimationFrame(s.raf);
          clearTimeout(s.timer);
          s.resolve?.();
          s.resolve = resolve;
          // coloca o resultado no topo da fita (fora da tela neste momento)
          setStrip((cur) => {
            const base = cur ?? [...symbols, ...Array.from({ length: FILL }, () => randomOf(pool))];
            return [...final, ...base.slice(rows)];
          });
          if (s.mode !== "spin") s.pos = Math.max(0, FILL - 8);
          // garante pelo menos ~6 linhas de deslocamento até o pouso
          s.from = Math.min(s.pos, FILL - 6);
          s.to = FILL;
          s.dur = Math.max(120, durationMs);
          s.mode = "land";
          s.t0 = performance.now();
          s.raf = requestAnimationFrame(frame);
          // rede de segurança: termina mesmo se o rAF estiver pausado
          s.timer = setTimeout(finish, s.dur + 250);
        });
      },
      hurry() {
        const s = st.current;
        if (s.mode === "land") {
          const elapsed = performance.now() - s.t0;
          if (s.dur - elapsed > 160) {
            // reinicia o pouso com duração curta a partir da posição atual
            s.from = s.pos;
            s.dur = 160;
            s.t0 = performance.now();
            clearTimeout(s.timer);
            s.timer = setTimeout(finish, 410);
          }
        }
      },
      snap() {
        finish();
      },
    });
  });

  useEffect(() => () => {
    cancelAnimationFrame(st.current.raf);
    clearTimeout(st.current.timer);
  }, []);

  // reaplica a posição quando o tamanho muda ou a fita é montada
  useLayoutEffect(apply, [strip, cell.h, gap]);

  const box = { width: cell.w, height: rows * cell.h + (rows - 1) * gap };
  const moving = !!strip;
  return (
    <div className="relative" style={box}>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        {strip ? (
          <div ref={stripEl} className="absolute left-0 right-0 top-0 flex flex-col will-change-transform" style={{ filter: moving ? "blur(0.9px)" : undefined }}>
            {strip.map((s, i) => (
              <div key={i} style={{ height: cell.h, marginBottom: gap }} className={cls("relative grid place-items-center", cellClass)}>
                <div style={{ width: cell.w * 0.86, height: cell.h * 0.86 }}>{renderSymbol(s, index, i)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col" style={{ gap }}>
            {symbols.map((s, row) => {
              const key = `${index}-${row}`;
              const hl = highlight?.has(key);
              const dim = highlight && highlight.size > 0 && !hl;
              const morph = changed.has(key);
              return (
                <div key={row} style={{ height: cell.h }} className={cls("relative grid place-items-center transition-opacity duration-300", cellClass, dim && "opacity-30")}>
                  <motion.div
                    key={`${s}-${row}-${morph ? "m" : ""}`}
                    initial={morph ? { scale: 0.2, rotate: -25, opacity: 0 } : false}
                    animate={hl ? { scale: [1, 1.13, 1], rotate: 0, opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                    transition={hl ? { repeat: Infinity, duration: 0.85, ease: "easeInOut" } : morph ? { type: "spring", damping: 11, stiffness: 260 } : { duration: 0.2 }}
                    style={{ width: cell.w * 0.86, height: cell.h * 0.86 }}
                    className={hl ? "drop-shadow-[0_0_12px_rgba(253,224,71,0.85)]" : ""}
                  >
                    {renderSymbol(s, index, row)}
                  </motion.div>
                  {morph && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={{ opacity: 0.95, scale: 0.6 }}
                      animate={{ opacity: 0, scale: 1.35 }}
                      transition={{ duration: 0.6 }}
                      style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(167,139,250,0.6) 40%, transparent 70%)" }}
                    />
                  )}
                  {cellOverlay?.(index, row)}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {anticipating && (
        <motion.div
          className="absolute -inset-1 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ boxShadow: `0 0 0 2px ${anticipationColor}, 0 0 26px ${anticipationColor}, inset 0 0 26px ${anticipationColor}66` }}
        />
      )}
    </div>
  );
}

/** Linhas de pagamento desenhadas por cima da grade. */
export function Paylines({ lines, active, reels, rows, colors, focus }: { lines: number[][]; active: number[]; reels: number; rows: number; colors?: string[]; focus?: number | null }) {
  const palette = colors ?? ["#fde047", "#f472b6", "#22d3ee", "#a78bfa", "#4ade80", "#fb923c"];
  const shown = focus != null ? active.filter((l) => l === focus) : active;
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${reels * 100} ${rows * 100}`} preserveAspectRatio="none">
      {shown.map((li) => {
        const k = active.indexOf(li);
        const color = palette[k % palette.length];
        const pts = lines[li]?.map((row, reel) => `${reel * 100 + 50},${row * 100 + 50}`).join(" ");
        if (!pts) return null;
        return (
          <motion.polyline
            key={`${li}-${focus ?? "all"}`}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={focus != null ? 6 : 4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: focus != null ? 0 : k * 0.07 }}
          />
        );
      })}
    </svg>
  );
}
