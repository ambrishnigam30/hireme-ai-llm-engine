/**
 * loss.ts
 */
import { Tensor, crossEntropyLoss } from '@mni-ml/framework';
import { PAD_ID } from '../tokenizer/vocabulary';

export class LossFunction {
  public static crossEntropySequence(logits: Tensor, targets: Tensor, ignoreIndex: number = PAD_ID): Tensor {
    const batchSize = logits.shape[0];
    const seqLen = logits.shape[1];
    const vocabSize = logits.shape[2];
    
    const flatLogits = logits.contiguous().view(batchSize * seqLen, vocabSize);
    const flatTargets = targets.contiguous().view(batchSize * seqLen);
    
    return crossEntropyLoss(flatLogits, flatTargets);
  }
}
