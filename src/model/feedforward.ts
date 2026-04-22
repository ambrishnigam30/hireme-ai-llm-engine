/**
 * feedforward.ts
 * Position-wise FeedForward Network.
 */
import { Module, Tensor, Linear } from '@mni-ml/framework';

export class FeedForward extends Module {
  private linear1: Linear;
  private linear2: Linear;

  constructor(dModel: number, dFF: number) {
    super();
    this.linear1 = new Linear(dModel, dFF);
    this.linear2 = new Linear(dFF, dModel);

    this.registerModule('linear1', this.linear1);
    this.registerModule('linear2', this.linear2);
  }

  public forward(x: Tensor): Tensor {
    let out = this.linear1.forward(x);
    out = out.relu();
    out = this.linear2.forward(out);
    return out;
  }
}
