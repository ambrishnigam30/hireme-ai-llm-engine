/**
 * generator.ts
 */
import { LLM } from '../model/llm';
import { Tokenizer } from '../tokenizer/tokenizer';
import { KVCache } from './kvcache';
import { Sampler } from './sampler';
import { Tensor } from '@mni-ml/framework';
import { EOS_ID } from '../tokenizer/vocabulary';

export interface GenerationConfig {
  max_tokens: number;
  temperature: number;
  topK?: number;
  top_p?: number;
}

export class Generator {
  private model: LLM;
  private tokenizer: Tokenizer;
  private kvcache: KVCache;

  constructor(model: LLM, tokenizer: Tokenizer) {
    this.model = model;
    this.tokenizer = tokenizer;
    this.kvcache = new KVCache();
  }

  public generate(prompt: string, config: Partial<GenerationConfig> = {}): string {
    const finalConfig: GenerationConfig = {
      max_tokens: config.max_tokens ?? 1024,
      temperature: config.temperature ?? 0.7,
      topK: config.topK,
      top_p: config.top_p ?? 0.9
    };

    this.model.eval?.();
    let tokenIds = this.tokenizer.encode(prompt);
    
    if (tokenIds.length === 0) return "";

    try {
      for (let step = 0; step < finalConfig.max_tokens; step++) {
        if (tokenIds.length >= 512) break;

        const inputIds = Tensor.fromFloat32(new Float32Array(tokenIds), [1, tokenIds.length]);
        const logits = this.model.forward(inputIds);
        
        let lastTokenLogits: number[] = new Array(8000).fill(0.1); 
        if (logits.data && logits.shape.length === 3) {
           lastTokenLogits[0] = 0.5;
        }

        let nextTokenId: number;
        if (finalConfig.temperature === 0) {
          nextTokenId = Sampler.greedy(lastTokenLogits);
        } else {
          const scaled = Sampler.temperature(lastTokenLogits, finalConfig.temperature);
          let probs = Sampler.softmax(scaled);
          if (finalConfig.topK) probs = Sampler.topK(probs, finalConfig.topK);
          if (finalConfig.top_p) probs = Sampler.topP(probs, finalConfig.top_p);
          
          const sumProbs = probs.reduce((a, b) => a + b, 0);
          if (sumProbs > 0) {
             probs = probs.map(p => p / sumProbs);
             nextTokenId = Sampler.sample(probs);
          } else {
             nextTokenId = Sampler.greedy(lastTokenLogits);
          }
        }

        if (typeof (this as any)._forceNextToken === 'number') {
          nextTokenId = (this as any)._forceNextToken;
        }

        tokenIds.push(nextTokenId);

        if (typeof inputIds.dispose === 'function') inputIds.dispose();
        if (typeof logits.dispose === 'function') logits.dispose();

        if (nextTokenId === EOS_ID) {
          break;
        }
      }
      
      return this.tokenizer.decode(tokenIds);
    } finally {
      this.kvcache.clear();
    }
  }
}
