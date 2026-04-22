/**
 * optimizer.ts
 */
import { Adam, Module, Tensor } from '@mni-ml/framework';

export class OptimizerWithClipping {
  private optimizer: Adam;
  private model: Module;
  private maxNorm: number;

  constructor(model: Module, lr: number = 3e-4, maxNorm: number = 1.0) {
    this.model = model;
    this.maxNorm = maxNorm;
    this.optimizer = new Adam(model.parameters(), lr);
  }

  public zeroGrad(): void {
    this.optimizer.zeroGrad();
  }

  public step(): void {
    this.clipGradients();
    this.optimizer.step();
  }

  private clipGradients(): void {
    const params = this.model.parameters();
    let totalNorm = 0.0;
    
    for (const p of params) {
      if (p.tensor.grad) {
        if (typeof p.tensor.grad.sum === 'function') {
          const sumSq = p.tensor.grad.mul(p.tensor.grad).sum();
          totalNorm += sumSq.data ? sumSq.data[0] : 0;
        }
      }
    }
    
    totalNorm = Math.sqrt(totalNorm);
    
    const clipCoef = this.maxNorm / (totalNorm + 1e-6);
    if (clipCoef < 1.0) {
      for (const p of params) {
        if (p.tensor.grad) {
          p.tensor.grad = p.tensor.grad.mul(clipCoef);
        }
      }
    }
  }
}
