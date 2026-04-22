/**
 * transformer.ts
 * A single Decoder-only Transformer Block.
 */
import { Module, Tensor, Parameter, layerNorm } from '@mni-ml/framework';
import { MultiHeadAttention } from './attention';
import { FeedForward } from './feedforward';

export class LayerNorm extends Module {
  public gamma: Parameter;
  public beta: Parameter;
  private eps: number;

  constructor(normalizedShape: number, eps: number = 1e-5) {
    super();
    this.eps = eps;
    this.gamma = new Parameter(Tensor.ones([normalizedShape]));
    this.beta = new Parameter(Tensor.zeros([normalizedShape]));
    this.registerParameter('gamma', this.gamma);
    this.registerParameter('beta', this.beta);
  }

  public forward(x: Tensor): Tensor {
    return layerNorm(x, this.gamma.tensor, this.beta.tensor, this.eps);
  }
}

export class TransformerBlock extends Module {
  private attention: MultiHeadAttention;
  private ff: FeedForward;
  private ln1: LayerNorm;
  private ln2: LayerNorm;

  constructor(dModel: number, nHeads: number, dFF: number) {
    super();
    this.attention = new MultiHeadAttention(dModel, nHeads);
    this.ff = new FeedForward(dModel, dFF);
    this.ln1 = new LayerNorm(dModel);
    this.ln2 = new LayerNorm(dModel);

    this.registerModule('attention', this.attention);
    this.registerModule('ff', this.ff);
    this.registerModule('ln1', this.ln1);
    this.registerModule('ln2', this.ln2);
  }

  public forward(x: Tensor, mask?: Tensor): Tensor {
    let normed1 = this.ln1.forward(x);
    let attnOut = this.attention.forward(normed1, mask);
    x = x.add(attnOut);

    let normed2 = this.ln2.forward(x);
    let ffOut = this.ff.forward(normed2);
    x = x.add(ffOut);

    return x;
  }
}
