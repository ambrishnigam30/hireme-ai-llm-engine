/**
 * @file src/data/dataloader.ts
 * @description Batch loading and dynamic padding for the training dataset.
 */

export interface Batch {
  inputIds: number[][];
  targetIds: number[][];
  attentionMask: number[][];
}

export class DataLoader {
  private data: { inputIds: number[]; targetIds: number[] }[];
  private batchSize: number;
  private padTokenId: number;

  constructor(
    data: { inputIds: number[]; targetIds: number[] }[],
    batchSize: number,
    padTokenId: number = 0
  ) {
    this.data = data;
    this.batchSize = batchSize;
    this.padTokenId = padTokenId;
  }

  *[Symbol.iterator](): IterableIterator<Batch> {
    for (let i = 0; i < this.data.length; i += this.batchSize) {
      const batchItems = this.data.slice(i, i + this.batchSize);
      
      // Find the maximum sequence lengths in THIS specific batch
      const maxInputLen = Math.max(...batchItems.map(item => item.inputIds.length));
      const maxTargetLen = Math.max(...batchItems.map(item => item.targetIds.length));

      const inputIds: number[][] = [];
      const targetIds: number[][] = [];
      const attentionMask: number[][] = [];

      for (const item of batchItems) {
        // Calculate padding counts
        const inputPadCount = maxInputLen - item.inputIds.length;
        const targetPadCount = maxTargetLen - item.targetIds.length;

        // Pad inputs with PAD_TOKEN_ID
        inputIds.push([...item.inputIds, ...Array(inputPadCount).fill(this.padTokenId)]);
        
        // Pad targets with PAD_TOKEN_ID
        targetIds.push([...item.targetIds, ...Array(targetPadCount).fill(this.padTokenId)]);

        // Generate attention mask: 1 for real tokens, 0 for padded gaps
        attentionMask.push([
          ...Array(item.inputIds.length).fill(1),
          ...Array(inputPadCount).fill(0)
        ]);
      }

      yield { inputIds, targetIds, attentionMask };
    }
  }
}
