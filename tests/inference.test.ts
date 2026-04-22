import { Sampler } from '../src/inference/sampler';
import { Generator } from '../src/inference/generator';
import { KVCache } from '../src/inference/kvcache';
import { EOS_ID } from '../src/tokenizer/vocabulary';

jest.mock('@mni-ml/framework', () => {
  class MockTensor {
    shape: number[];
    data: Float32Array;
    constructor(shape: number[], val=1.0) { this.shape = shape; this.data = new Float32Array(shape.reduce((a,b)=>a*b,1) || 1).fill(val); }
    static fromFloat32(data: any, shape: number[]) { return new MockTensor(shape, 1.0); }
    view(...s: number[]) { return this; }
    dispose() {}
  }
  return { Tensor: MockTensor, Module: class { forward() { return new MockTensor([1, 1, 8000], 0.1); } eval() {} } };
});

describe('Phase 5: Inference Engine + KV Cache', () => {
  it('1. Greedy Sampling correctness', () => {
    const logits = [0.1, 0.8, 0.1];
    const idx = Sampler.greedy(logits);
    expect(idx).toBe(1);
  });

  it('2. Temperature Scaling logic', () => {
    const logits = [1.0, 2.0, 3.0];
    
    // temp 1.0 = no change
    const scaled1 = Sampler.temperature(logits, 1.0);
    expect(scaled1).toEqual(logits);
    
    // temp 2.0 = flattens
    const scaled2 = Sampler.temperature(logits, 2.0);
    expect(scaled2).toEqual([0.5, 1.0, 1.5]);
  });

  it('3. Generator stops immediately at EOS detection', () => {
    const mockTokenizer = {
      encode: () => [1, 2],
      decode: (ids: number[]) => ids.join(',')
    } as any;
    
    const { Module } = require('@mni-ml/framework');
    class MockLLM extends Module {}
    const model = new MockLLM() as any;

    const generator = new Generator(model, mockTokenizer);
    
    (generator as any)._forceNextToken = EOS_ID;
    
    const output = generator.generate("dummy prompt", { maxNewTokens: 50, temperature: 0 });
    
    expect(output).toBe(`1,2,${EOS_ID}`);
  });

  it('4. KV Cache accurately tracks size and releases memory', () => {
    const cache = new KVCache();
    const { Tensor } = require('@mni-ml/framework');
    
    const mockK = new Tensor([1, 10, 8, 32]);
    const mockV = new Tensor([1, 10, 8, 32]);
    
    cache.update(0, mockK, mockV);
    expect(cache.size()).toBe(10);
    
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
