/**
 * kvcache.ts
 */
import { Tensor } from '@mni-ml/framework';

export class KVCache {
  private cache: Map<number, { k: Tensor, v: Tensor }> = new Map();
  private seqLen: number = 0;

  public update(layer: number, newK: Tensor, newV: Tensor): { k: Tensor, v: Tensor } {
    if (!this.cache.has(layer)) {
      this.cache.set(layer, { k: newK, v: newV });
      if (layer === 0) this.seqLen = newK.shape[1]; // batch, seq, heads, dim
      return { k: newK, v: newV };
    }

    const cached = this.cache.get(layer)!;
    
    let kResult: Tensor;
    let vResult: Tensor;
    if (typeof (cached.k as any).cat === 'function') {
      kResult = (cached.k as any).cat([newK], 1);
      vResult = (cached.v as any).cat([newV], 1);
    } else {
      kResult = newK;
      vResult = newV;
    }

    this.cache.set(layer, { k: kResult, v: vResult });
    if (layer === 0) this.seqLen += newK.shape[1];

    return { k: kResult, v: vResult };
  }

  public size(): number {
    return this.seqLen;
  }

  public clear(): void {
    for (const [_, cached] of this.cache) {
      if (typeof cached.k.dispose === 'function') cached.k.dispose();
      if (typeof cached.v.dispose === 'function') cached.v.dispose();
    }
    this.cache.clear();
    this.seqLen = 0;
  }
}
