/**
 * preprocessor.ts
 * Cleans text and formats into input/output pairs.
 */
import { Tokenizer } from '../tokenizer/tokenizer';
import { BOS_ID, EOS_ID, SEP_ID } from '../tokenizer/vocabulary';
import * as fs from 'fs';

export interface ProcessedDataset {
  train: { inputIds: number[], targetIds: number[] }[];
  val: { inputIds: number[], targetIds: number[] }[];
  test: { inputIds: number[], targetIds: number[] }[];
}

export class Preprocessor {
  private tokenizer: Tokenizer;

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }

  public cleanText(text: string): string {
    if (!text) return '';
    let cleaned = text.replace(/<[^>]*>?/gm, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
  }

  public formatPair(jobDesc: string, weakResume: string, strongResume: string, maxTokens: number): { inputIds: number[], targetIds: number[] } {
    const cleanedJd = this.cleanText(jobDesc);
    const cleanedWeak = this.cleanText(weakResume);
    const cleanedStrong = this.cleanText(strongResume);

    const jdTokens = this.tokenizer.encode(`JOB: ${cleanedJd} `);
    const weakTokens = this.tokenizer.encode(`RESUME: ${cleanedWeak} `);
    const strongTokens = this.tokenizer.encode(`OPTIMIZED: ${cleanedStrong}`);

    let inputIds = [BOS_ID, ...jdTokens, SEP_ID, ...weakTokens, SEP_ID];
    let targetIds = [BOS_ID, ...strongTokens, EOS_ID];

    // Truncate properly, ensuring special tokens are kept if possible
    if (inputIds.length > maxTokens) {
      inputIds = inputIds.slice(0, maxTokens - 1);
      inputIds.push(SEP_ID);
    }
    
    if (targetIds.length > maxTokens) {
      targetIds = targetIds.slice(0, maxTokens - 1);
      targetIds.push(EOS_ID);
    }

    return { inputIds, targetIds };
  }

  public processDataset(
    jsonlPath: string,
    maxTokens: number,
    mapFn: (row: any) => { jobDesc: string, weakResume: string, strongResume: string } | null
  ): ProcessedDataset {
    const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n').filter(l => l.trim().length > 0);
    const processed: { inputIds: number[], targetIds: number[] }[] = [];

    for (const line of lines) {
      try {
        const row = JSON.parse(line);
        const mapped = mapFn(row);
        if (!mapped) continue;

        const pair = this.formatPair(mapped.jobDesc, mapped.weakResume, mapped.strongResume, maxTokens);
        processed.push(pair);
      } catch (e) {
        // Skip invalid
      }
    }

    this.shuffleArray(processed);
    const trainEnd = Math.floor(processed.length * 0.8);
    const valEnd = Math.floor(processed.length * 0.9);

    return {
      train: processed.slice(0, trainEnd),
      val: processed.slice(trainEnd, valEnd),
      test: processed.slice(valEnd)
    };
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
