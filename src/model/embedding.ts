/**
 * embedding.ts
 */
import { Module, Tensor, Embedding as MniEmbedding } from '@mni-ml/framework';

export class Embedding extends Module {
  private tokenEmbedding: MniEmbedding;
  private dModel: number;
  private maxSeqLen: number;

  constructor(vocabSize: number, dModel: number, maxSeqLen: number) {
    super();
    this.dModel = dModel;
    this.maxSeqLen = maxSeqLen;
    this.tokenEmbedding = new MniEmbedding(vocabSize, dModel);
    this.registerModule('tokenEmbedding', this.tokenEmbedding);
  }

  public forward(tokenIds: Tensor): Tensor {
    const batchSize = tokenIds.shape[0];
    const seqLen = tokenIds.shape[1];
    
    if (seqLen > this.maxSeqLen) {
      throw new Error(`Sequence length ${seqLen} exceeds maxSeqLen ${this.maxSeqLen}`);
    }

    const tokEmb = this.tokenEmbedding.forward(tokenIds);

    const pe = new Float32Array(batchSize * seqLen * this.dModel);
    
    for (let b = 0; b < batchSize; b++) {
      for (let pos = 0; pos < seqLen; pos++) {
        for (let i = 0; i < this.dModel; i += 2) {
          const divTerm = Math.exp((i * -Math.log(10000.0)) / this.dModel);
          const posOffset = b * (seqLen * this.dModel) + pos * this.dModel + i;
          
          pe[posOffset] = Math.sin(pos * divTerm);
          if (i + 1 < this.dModel) {
            pe[posOffset + 1] = Math.cos(pos * divTerm);
          }
        }
      }
    }

    const posEmb = Tensor.fromFloat32(pe, [batchSize, seqLen, this.dModel]);
    
    return tokEmb.add(posEmb);
  }
}
