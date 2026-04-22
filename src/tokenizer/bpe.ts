/**
 * bpe.ts
 * Implements Byte Pair Encoding (BPE) training logic.
 */
import { Vocabulary } from './vocabulary';

export class BPE {
  private merges: Map<string, number>;

  constructor() {
    this.merges = new Map();
  }

  /**
   * Returns the learned merge rules.
   */
  public getMerges(): Map<string, number> {
    return this.merges;
  }

  /**
   * Trains the BPE tokenizer on a given corpus.
   * @param corpus Array of text strings.
   * @param targetVocabSize The desired final vocabulary size.
   * @param vocab The Vocabulary instance to populate.
   */
  public train(corpus: string[], targetVocabSize: number, vocab: Vocabulary): void {
    // 1. Initialize character vocabulary and base words
    const words: string[][] = [];
    
    for (const text of corpus) {
      const chars = Array.from(text);
      for (const char of chars) {
        vocab.addToken(char);
      }
      words.push(chars);
    }

    // 2. Iteratively merge the most frequent pair
    while (vocab.size() < targetVocabSize) {
      const pairCounts = new Map<string, number>();

      // Count pairs
      for (const word of words) {
        for (let i = 0; i < word.length - 1; i++) {
          const pair = `${word[i]}|${word[i + 1]}`;
          pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
        }
      }

      if (pairCounts.size === 0) {
        break; // No more pairs to merge
      }

      // Find most frequent pair
      let bestPair = '';
      let maxCount = -1;
      for (const [pair, count] of pairCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          bestPair = pair;
        }
      }

      const [first, second] = bestPair.split('|');
      const mergedToken = first + second;
      const newId = vocab.addToken(mergedToken);
      this.merges.set(bestPair, newId);

      // Apply merge to all words
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const newWord: string[] = [];
        let j = 0;
        while (j < word.length) {
          if (j < word.length - 1 && word[j] === first && word[j + 1] === second) {
            newWord.push(mergedToken);
            j += 2;
          } else {
            newWord.push(word[j]);
            j += 1;
          }
        }
        words[i] = newWord;
      }
    }
  }
}
