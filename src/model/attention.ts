/**
 * attention.ts
 * Multi-Head Causal Self-Attention.
 */
import { Module, Tensor, Linear, softmax } from '@mni-ml/framework';

export class MultiHeadAttention extends Module {
  private dModel: number;
  private nHeads: number;
  private dHead: number;
  
  private qProj: Linear;
  private kProj: Linear;
  private vProj: Linear;
  private outProj: Linear;

  constructor(dModel: number, nHeads: number) {
    super();
    this.dModel = dModel;
    this.nHeads = nHeads;
    this.dHead = Math.floor(dModel / nHeads);
    
    if (this.dHead * nHeads !== dModel) {
      throw new Error("dModel must be divisible by nHeads");
    }

    this.qProj = new Linear(dModel, dModel);
    this.kProj = new Linear(dModel, dModel);
    this.vProj = new Linear(dModel, dModel);
    this.outProj = new Linear(dModel, dModel);

    this.registerModule('qProj', this.qProj);
    this.registerModule('kProj', this.kProj);
    this.registerModule('vProj', this.vProj);
    this.registerModule('outProj', this.outProj);
  }

  public forward(x: Tensor, mask?: Tensor): Tensor {
    const batchSize = x.shape[0];
    const seqLen = x.shape[1];

    let Q = this.qProj.forward(x);
    let K = this.kProj.forward(x);
    let V = this.vProj.forward(x);

    Q = Q.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();
    K = K.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();
    V = V.view(batchSize, seqLen, this.nHeads, this.dHead).permute(0, 2, 1, 3).contiguous();

    const K_T = K.permute(0, 1, 3, 2).contiguous();
    
    let scores = Q.matmul(K_T);

    const scale = 1.0 / Math.sqrt(this.dHead);
    scores = scores.mul(scale);

    if (mask) {
      scores = scores.add(mask);
    }

    let attn = softmax(scores, 3);
    let out = attn.matmul(V);

    out = out.permute(0, 2, 1, 3).contiguous().view(batchSize, seqLen, this.dModel);
    return this.outProj.forward(out);
  }
}
