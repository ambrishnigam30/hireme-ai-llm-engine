/**
 * llm.ts
 * Complete LLM Model combining embedding, transformer blocks, and LM head.
 */
import { Module, Tensor, Linear } from '@mni-ml/framework';
import { Embedding } from './embedding';
import { TransformerBlock, LayerNorm } from './transformer';

export interface ModelConfig {
  vocabSize: number;
  dModel: number;
  nHeads: number;
  nLayers: number;
  dFF: number;
  maxSeqLen: number;
  dropout: number;
  padTokenId: number;
}

export const MODEL_CONFIG: ModelConfig = {
  vocabSize: 8000,
  dModel: 256,
  nHeads: 8,
  nLayers: 6,
  dFF: 1024,
  maxSeqLen: 512,
  dropout: 0.1,
  padTokenId: 0
};

export class LLM extends Module {
  public config: ModelConfig;
  private embedding: Embedding;
  private blocks: TransformerBlock[];
  private finalLn: LayerNorm;
  private lmHead: Linear;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    
    this.embedding = new Embedding(config.vocabSize, config.dModel, config.maxSeqLen);
    this.registerModule('embedding', this.embedding);

    this.blocks = [];
    for (let i = 0; i < config.nLayers; i++) {
      const block = new TransformerBlock(config.dModel, config.nHeads, config.dFF);
      this.blocks.push(block);
      this.registerModule(`block_${i}`, block);
    }

    this.finalLn = new LayerNorm(config.dModel);
    this.registerModule('finalLn', this.finalLn);

    this.lmHead = new Linear(config.dModel, config.vocabSize);
    this.registerModule('lmHead', this.lmHead);
  }

  public countParameters(): number {
    let count = 0;
    const params = this.parameters();
    for (const p of params) {
      let size = 1;
      for (const dim of p.tensor.shape) {
        size *= dim;
      }
      count += size;
    }
    return count;
  }

  private generateCausalMask(batchSize: number, seqLen: number, nHeads: number): Tensor {
    const totalSize = batchSize * nHeads * seqLen * seqLen;
    const maskData = new Float32Array(totalSize);

    for (let b = 0; b < batchSize; b++) {
      for (let h = 0; h < nHeads; h++) {
        for (let i = 0; i < seqLen; i++) {
          for (let j = 0; j < seqLen; j++) {
            const idx = b * (nHeads * seqLen * seqLen) + h * (seqLen * seqLen) + i * seqLen + j;
            if (j > i) {
              maskData[idx] = -1e9;
            } else {
              maskData[idx] = 0.0;
            }
          }
        }
      }
    }

    return Tensor.fromFloat32(maskData, [batchSize, nHeads, seqLen, seqLen]);
  }

  public forward(tokenIds: Tensor): Tensor {
    const batchSize = tokenIds.shape[0];
    const seqLen = tokenIds.shape[1];

    let x = this.embedding.forward(tokenIds);
    const mask = this.generateCausalMask(batchSize, seqLen, this.config.nHeads);

    for (const block of this.blocks) {
      x = block.forward(x, mask);
    }

    x = this.finalLn.forward(x);
    const logits = this.lmHead.forward(x);

    return logits;
  }

  public save(path: string): void {
    console.log(`Saving LLM to ${path}`);
  }

  public load(path: string): void {
    console.log(`Loading LLM from ${path}`);
  }
}
