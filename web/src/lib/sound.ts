/**
 * Efeitos sonoros sintetizados com WebAudio (nenhum arquivo de áudio).
 */
let ctx: AudioContext | null = null;
let enabled = true;
let master: GainNode | null = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
}

type ToneOpts = { freq: number; dur: number; type?: OscillatorType; vol?: number; slide?: number; delay?: number; attack?: number };

function tone({ freq, dur, type = "sine", vol = 0.5, slide, delay = 0, attack = 0.005 }: ToneOpts) {
  const c = ac();
  if (!c || !enabled || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.3, delay = 0, hp = 1000) {
  const c = ac();
  if (!c || !enabled || !master) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(master);
  s.start(t);
}

const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export const sfx = {
  click: () => tone({ freq: 900, dur: 0.05, type: "triangle", vol: 0.25 }),
  chip: () => {
    tone({ freq: 2400, dur: 0.04, type: "square", vol: 0.08 });
    tone({ freq: 3200, dur: 0.05, type: "triangle", vol: 0.12, delay: 0.015 });
  },
  spinStart: () => tone({ freq: 180, dur: 0.35, type: "sawtooth", vol: 0.12, slide: 520 }),
  reelTick: () => tone({ freq: 1400 + Math.random() * 300, dur: 0.02, type: "square", vol: 0.04 }),
  reelStop: (i = 0) => {
    tone({ freq: 160 - i * 8, dur: 0.12, type: "triangle", vol: 0.45 });
    noise(0.05, 0.12, 0, 2500);
  },
  anticipation: () => {
    for (let i = 0; i < 8; i++) tone({ freq: 400 + i * 60, dur: 0.12, type: "sawtooth", vol: 0.06, delay: i * 0.1 });
  },
  card: () => {
    noise(0.07, 0.25, 0, 3000);
    tone({ freq: 700, dur: 0.05, type: "triangle", vol: 0.12, delay: 0.02 });
  },
  flip: () => {
    noise(0.05, 0.18, 0, 4000);
    tone({ freq: 1200, dur: 0.12, type: "sine", vol: 0.2, slide: 2400, delay: 0.03 });
  },
  arcane: () => {
    [0, 2, 4, 7].forEach((n, i) => tone({ freq: notes[n], dur: 0.35, type: "sine", vol: 0.22, delay: i * 0.06 }));
    tone({ freq: 2093, dur: 0.6, type: "sine", vol: 0.08, delay: 0.25 });
  },
  win: (big = false) => {
    const seq = big ? [0, 2, 4, 5, 7] : [0, 2, 4];
    seq.forEach((n, i) => tone({ freq: notes[n], dur: 0.18, type: "triangle", vol: 0.3, delay: i * 0.08 }));
  },
  smallWin: () => {
    tone({ freq: notes[2], dur: 0.12, type: "triangle", vol: 0.25 });
    tone({ freq: notes[4], dur: 0.16, type: "triangle", vol: 0.25, delay: 0.07 });
  },
  lose: () => tone({ freq: 300, dur: 0.3, type: "sine", vol: 0.15, slide: 140 }),
  coin: () => {
    tone({ freq: 1975, dur: 0.07, type: "square", vol: 0.06 });
    tone({ freq: 2637, dur: 0.12, type: "square", vol: 0.06, delay: 0.06 });
  },
  count: () => tone({ freq: 1600 + Math.random() * 400, dur: 0.03, type: "square", vol: 0.03 }),
  scatter: () => {
    [0, 4, 7].forEach((n, i) => tone({ freq: notes[n] * 2, dur: 0.25, type: "sine", vol: 0.2, delay: i * 0.05 }));
  },
  jackpot: () => {
    for (let r = 0; r < 3; r++) [0, 2, 4, 7].forEach((n, i) => tone({ freq: notes[n] * (1 + r * 0.5), dur: 0.22, type: "triangle", vol: 0.25, delay: r * 0.35 + i * 0.07 }));
  },
  freeSpins: () => {
    [0, 2, 4, 5, 7, 7].forEach((n, i) => tone({ freq: notes[n], dur: 0.3, type: "sine", vol: 0.25, delay: i * 0.1 }));
  },
  explode: () => {
    noise(0.4, 0.4, 0, 200);
    tone({ freq: 120, dur: 0.4, type: "sine", vol: 0.5, slide: 40 });
  },
  tick: () => tone({ freq: 2000, dur: 0.015, type: "square", vol: 0.05 }),
  ball: () => tone({ freq: 2200 + Math.random() * 800, dur: 0.03, type: "sine", vol: 0.08 }),
  pop: () => tone({ freq: 600, dur: 0.08, type: "sine", vol: 0.25, slide: 1200 }),
  gem: () => {
    tone({ freq: 1568, dur: 0.15, type: "sine", vol: 0.2 });
    tone({ freq: 2349, dur: 0.2, type: "sine", vol: 0.12, delay: 0.05 });
  },
  whoosh: () => noise(0.25, 0.15, 0, 600),
};

/** Destrava o áudio no iOS no primeiro toque. */
export function unlockAudio() {
  const h = () => {
    ac();
    window.removeEventListener("pointerdown", h);
  };
  window.addEventListener("pointerdown", h);
}
