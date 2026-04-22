/**
 * trainer.ts
 */
import { LLM } from '../model/llm';
import { DataLoader } from '../data/dataloader';
import { OptimizerWithClipping } from './optimizer';
import { LossFunction } from './loss';
import { Tensor } from '@mni-ml/framework';

export class Trainer {
  private model: LLM;
  private trainLoader: DataLoader;
  private valLoader: DataLoader;
  private optimizer: OptimizerWithClipping;
  private epochs: number;

  constructor(model: LLM, trainLoader: DataLoader, valLoader: DataLoader, optimizer: OptimizerWithClipping, epochs: number) {
    this.model = model;
    this.trainLoader = trainLoader;
    this.valLoader = valLoader;
    this.optimizer = optimizer;
    this.epochs = epochs;
  }

  public trainEpoch(): number {
    this.model.train?.();
    let totalLoss = 0;
    let batches = 0;

    for (const batch of this.trainLoader) {
      this.optimizer.zeroGrad();

      const inputIds = Tensor.fromFloat32(new Float32Array(batch.inputIds.flat()), [batch.inputIds.length, batch.inputIds[0].length]);
      const targetIds = Tensor.fromFloat32(new Float32Array(batch.targetIds.flat()), [batch.targetIds.length, batch.targetIds[0].length]);
      
      const logits = this.model.forward(inputIds);
      const loss = LossFunction.crossEntropySequence(logits, targetIds);
      
      loss.backward?.();
      this.optimizer.step();

      totalLoss += loss.data ? loss.data[0] : 1.0;
      batches++;

      if (typeof logits.dispose === 'function') logits.dispose();
      if (typeof loss.dispose === 'function') loss.dispose();
      if (typeof inputIds.dispose === 'function') inputIds.dispose();
      if (typeof targetIds.dispose === 'function') targetIds.dispose();
    }

    return batches > 0 ? totalLoss / batches : 0;
  }

  public evaluate(): number {
    this.model.eval?.();
    let totalLoss = 0;
    let batches = 0;

    for (const batch of this.valLoader) {
      const inputIds = Tensor.fromFloat32(new Float32Array(batch.inputIds.flat()), [batch.inputIds.length, batch.inputIds[0].length]);
      const targetIds = Tensor.fromFloat32(new Float32Array(batch.targetIds.flat()), [batch.targetIds.length, batch.targetIds[0].length]);
      
      const logits = this.model.forward(inputIds);
      const loss = LossFunction.crossEntropySequence(logits, targetIds);

      totalLoss += loss.data ? loss.data[0] : 1.0;
      batches++;

      if (typeof logits.dispose === 'function') logits.dispose();
      if (typeof loss.dispose === 'function') loss.dispose();
      if (typeof inputIds.dispose === 'function') inputIds.dispose();
      if (typeof targetIds.dispose === 'function') targetIds.dispose();
    }

    return batches > 0 ? totalLoss / batches : 0;
  }

  public train(): void {
    let bestValLoss = Infinity;

    for (let epoch = 1; epoch <= this.epochs; epoch++) {
      console.log(`Epoch ${epoch}/${this.epochs} started...`);
      
      const trainLoss = this.trainEpoch();
      console.log(`Epoch ${epoch} - Train Loss: ${trainLoss.toFixed(4)}`);
      
      const valLoss = this.evaluate();
      console.log(`Epoch ${epoch} - Val Loss: ${valLoss.toFixed(4)}`);

      if (valLoss < bestValLoss) {
        bestValLoss = valLoss;
        console.log(`New best validation loss: ${bestValLoss.toFixed(4)}. Saving checkpoint...`);
        this.model.save('checkpoint.bin');
      }
    }
  }
}
