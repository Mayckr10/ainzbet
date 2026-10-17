import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Provably fair: cada número aleatório vem de
 *   HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`)
 * O hash SHA-256 do serverSeed é mostrado antes das apostas; o serverSeed é revelado
 * quando o jogador troca de seed, e aí qualquer rodada pode ser conferida.
 */

export function newServerSeed() {
  const seed = randomBytes(32).toString("hex");
  return { seed, hash: sha256(seed) };
}

export function newClientSeed() {
  return randomBytes(8).toString("hex");
}

export function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export class Rng {
  private cursor = 0;
  private buf: Buffer = Buffer.alloc(0);
  private off = 32;

  constructor(
    private serverSeed: string,
    private clientSeed: string,
    private nonce: number,
  ) {}

  private nextBlock() {
    this.buf = createHmac("sha256", this.serverSeed)
      .update(`${this.clientSeed}:${this.nonce}:${this.cursor++}`)
      .digest();
    this.off = 0;
  }

  /** Número em [0, 1) a partir de 4 bytes (mesmo método usado pelos cassinos cripto). */
  float(): number {
    if (this.off >= 32) this.nextBlock();
    const b = this.buf;
    const o = this.off;
    this.off += 4;
    return b[o] / 256 + b[o + 1] / 256 ** 2 + b[o + 2] / 256 ** 3 + b[o + 3] / 256 ** 4;
  }

  /** Inteiro em [0, n). */
  int(n: number): number {
    return Math.floor(this.float() * n);
  }

  /** Embaralhamento Fisher–Yates (retorna cópia). */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** k valores distintos de [0, n), na ordem sorteada. */
  pickUnique(n: number, k: number): number[] {
    const pool = Array.from({ length: n }, (_, i) => i);
    const out: number[] = [];
    for (let i = 0; i < k; i++) {
      const j = i + this.int(n - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
      out.push(pool[i]);
    }
    return out;
  }

  /** Escolha ponderada: retorna o índice. */
  weighted(weights: readonly number[]): number {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = this.float() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
}

/** Multiplicador estilo "crash/limbo" com 1% de vantagem da casa: P(X ≥ x) = 0,99 / x. */
export function crashPoint(r: number, max = 50_000) {
  const x = Math.floor((100 * 0.99) / (1 - r)) / 100;
  return Math.min(max, Math.max(1, x));
}
