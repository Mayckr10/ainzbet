/**
 * Cache de símbolos rasterizados para os rolos.
 *
 * Durante o giro, desenhar dezenas de SVGs com gradientes e sombras a cada quadro trava o celular.
 * Aqui cada símbolo é convertido UMA vez em bitmap na resolução real da tela (devicePixelRatio),
 * junto com uma versão com desfoque de movimento vertical. O rolo em movimento usa só essas
 * imagens, e a animação vira um simples translate3d acelerado pela GPU.
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { createElement } from "react";
import { ArtDefs } from "../art/defs";

export type SymbolBitmaps = { sharp: string; blur: string };

let defsMarkup: string | null = null;
let fontCss = "";
function defs() {
  if (defsMarkup === null) {
    const html = renderToStaticMarkup(createElement(ArtDefs));
    const m = /<defs>[\s\S]*<\/defs>/.exec(html);
    defsMarkup = m ? m[0] : "";
  }
  return defsMarkup.replace("<defs>", `<defs>${fontCss ? `<style>${fontCss}</style>` : ""}`);
}

/**
 * Um SVG usado como imagem não enxerga as fontes da página. Para os rótulos (WILD, FREE...)
 * saírem iguais aos do jogo, a fonte é embutida em base64 uma vez.
 */
let fontPromise: Promise<void> | null = null;
function loadFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const css = await fetch("https://fonts.googleapis.com/css2?family=Unbounded:wght@900&display=block", { signal: ctrl.signal }).then((r) => r.text());
        const url = /url\((https:[^)]+\.woff2)\)/.exec(css)?.[1];
        if (url) {
          const buf = await fetch(url, { signal: ctrl.signal }).then((r) => r.arrayBuffer());
          let bin = "";
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          fontCss = `@font-face{font-family:'Unbounded';font-weight:900;src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
        }
        clearTimeout(t);
      } catch {
        /* sem a fonte, usa a padrão */
      }
    })();
  }
  return fontPromise;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

// toDataURL é síncrono: não depende de quadros sendo desenhados (toBlob pode atrasar em segundo plano)
async function toBlobUrl(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

/** Rasteriza um elemento <svg> (com os gradientes globais) em `px` pixels. */
async function rasterize(el: ReactElement, px: number): Promise<SymbolBitmaps> {
  let svg = renderToStaticMarkup(el);
  if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  // troca width/height do <svg> raiz (que costumam ser "100%") pelo tamanho em pixels
  svg = svg.replace(/<svg([^>]*)>/, (_m, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} width="${px}" height="${px}">${defs()}`);
  // a margem extra deixa espaço para sombras/brilhos que saem do quadro
  const pad = Math.round(px * 0.08);
  const W = px + pad * 2;
  const img = await svgToImage(svg);

  const sharp = document.createElement("canvas");
  sharp.width = W;
  sharp.height = W;
  sharp.getContext("2d")!.drawImage(img, pad, pad, px, px);

  // desfoque de movimento: média de cópias deslocadas na vertical
  const blur = document.createElement("canvas");
  blur.width = W;
  blur.height = W;
  const g = blur.getContext("2d")!;
  const N = 9;
  const spread = px * 0.32;
  for (let k = 0; k < N; k++) {
    g.globalAlpha = 1 / (k + 1);
    const dy = (k / (N - 1) - 0.5) * spread;
    g.drawImage(sharp, 0, dy);
  }
  return { sharp: await toBlobUrl(sharp), blur: await toBlobUrl(blur) };
}

const cache = new Map<string, Promise<SymbolBitmaps>>();

/**
 * Gera (ou reaproveita) os bitmaps de uma lista de símbolos.
 * `key` identifica o tema do jogo; `render` devolve o <svg> de cada símbolo.
 */
export function getSymbolBitmaps(key: string, symbols: number[], render: (sym: number) => ReactElement, cssSize: number) {
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const px = Math.max(48, Math.round((cssSize * dpr) / 16) * 16); // arredonda para reaproveitar cache
  const out = new Map<number, Promise<SymbolBitmaps>>();
  for (const s of new Set(symbols)) {
    const k = `${key}:${s}:${px}:${fontCss ? "f" : "n"}`;
    if (!cache.has(k)) cache.set(k, rasterize(render(s), px).catch((e) => { console.warn("rasterize falhou", s, e); return { sharp: "", blur: "" }; }));
    out.set(s, cache.get(k)!);
  }
  return { px, pad: Math.round(px * 0.08), bitmaps: out };
}

/** Começa a baixar a fonte já na abertura do app; resolve quando ela estiver embutível. */
export const fontReady: Promise<boolean> = typeof window !== "undefined" ? loadFont().then(() => !!fontCss) : Promise.resolve(false);
export const hasFont = () => !!fontCss;
