/**
 * sampler.ts
 */
export class Sampler {
  public static greedy(logits: number[]): number {
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > maxVal) {
        maxVal = logits[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  public static temperature(logits: number[], temp: number): number[] {
    if (temp === 0 || temp === 1.0) return [...logits];
    return logits.map(l => l / temp);
  }

  public static softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
  }

  public static topK(probs: number[], k: number): number[] {
    const indexedProbs = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
    const topK = indexedProbs.slice(0, k);
    const result = new Array(probs.length).fill(0);
    for (const item of topK) {
      result[item.i] = item.p;
    }
    return result;
  }

  public static topP(probs: number[], p: number): number[] {
    const indexedProbs = probs.map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
    const result = new Array(probs.length).fill(0);
    let cumulative = 0.0;
    for (const item of indexedProbs) {
      result[item.i] = item.prob;
      cumulative += item.prob;
      if (cumulative > p) break;
    }
    return result;
  }
  
  public static sample(probs: number[]): number {
    const r = Math.random();
    let cumulative = 0.0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (r <= cumulative) return i;
    }
    return probs.length - 1;
  }
}
