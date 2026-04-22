/**
 * dataloader.ts
 * Manages dataset batching, shuffling, and padding.
 */
import { PAD_ID } from '../tokenizer/vocabulary';

export interface Batch {
  inputIds: number[][];
  targetIds: number[][];
  attentionMask: number[][];
}

export class DataLoader {
  private data: { inputIds: number[], targetIds: number[] }[];
  private batchSize: number;
  private maxLen: number;
  private currentIndex: number;

  constructor(data: { inputIds: number[], targetIds: number[] }[], batchSize: number, maxLen: number) {
    this.data = [...data];
    this.batchSize = batchSize;
    this.maxLen = maxLen;
    this.currentIndex = 0;
  }

  /**
   * Shuffles the dataset randomly.
   */
  public shuffle(): void {
    for (let i = this.data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
    }
  }

  /**
   * Resets the iterator.
   */
  public reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Returns the next batch of data or null if the epoch is finished.
   */
  public nextBatch(): Batch | null {
    if (this.currentIndex >= this.data.length) {
      return null;
    }

    const end = Math.min(this.currentIndex + this.batchSize, this.data.length);
    const batchData = this.data.slice(this.currentIndex, end);
    this.currentIndex = end;

    const inputIds: number[][] = [];
    const targetIds: number[][] = [];
    const attentionMask: number[][] = [];

    for (const item of batchData) {
      const padLenInput = Math.max(0, this.maxLen - item.inputIds.length);
      const paddedInput = [...item.inputIds, ...new Array(padLenInput).fill(PAD_ID)];
      
      const padLenTarget = Math.max(0, this.maxLen - item.targetIds.length);
      const paddedTarget = [...item.targetIds, ...new Array(padLenTarget).fill(PAD_ID)];

      const mask = paddedInput.map(id => id === PAD_ID ? 0 : 1);

      inputIds.push(paddedInput);
      targetIds.push(paddedTarget);
      attentionMask.push(mask);
    }

    return { inputIds, targetIds, attentionMask };
  }
}
