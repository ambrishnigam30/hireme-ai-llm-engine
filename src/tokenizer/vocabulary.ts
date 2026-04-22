/**
 * vocabulary.ts
 * Manages the token-to-ID and ID-to-token mappings, including special tokens.
 */
import * as fs from 'fs';

export const SPECIAL_TOKENS = {
  PAD: '[PAD]',
  UNK: '[UNK]',
  BOS: '[BOS]',
  EOS: '[EOS]',
  SEP: '[SEP]',
};

export const PAD_ID = 0;
export const UNK_ID = 1;
export const BOS_ID = 2;
export const EOS_ID = 3;
export const SEP_ID = 4;

export class Vocabulary {
  private tokenToId: Map<string, number>;
  private idToToken: Map<number, string>;
  private nextId: number;

  constructor() {
    this.tokenToId = new Map();
    this.idToToken = new Map();
    this.nextId = 0;

    // Initialize special tokens
    this.addToken(SPECIAL_TOKENS.PAD); // 0
    this.addToken(SPECIAL_TOKENS.UNK); // 1
    this.addToken(SPECIAL_TOKENS.BOS); // 2
    this.addToken(SPECIAL_TOKENS.EOS); // 3
    this.addToken(SPECIAL_TOKENS.SEP); // 4
  }

  /**
   * Adds a token to the vocabulary if it doesn't exist.
   * @param token The string token to add.
   * @returns The integer ID assigned to the token.
   */
  public addToken(token: string): number {
    if (this.tokenToId.has(token)) {
      return this.tokenToId.get(token)!;
    }
    const id = this.nextId++;
    this.tokenToId.set(token, id);
    this.idToToken.set(id, token);
    return id;
  }

  /**
   * Retrieves the string token for a given integer ID.
   * @param id The token ID.
   * @returns The string token or undefined if not found.
   */
  public getToken(id: number): string | undefined {
    return this.idToToken.get(id);
  }

  /**
   * Retrieves the integer ID for a given string token.
   * @param token The string token.
   * @returns The token ID or undefined if not found.
   */
  public getId(token: string): number | undefined {
    return this.tokenToId.get(token);
  }

  /**
   * Returns the total number of tokens in the vocabulary.
   */
  public size(): number {
    return this.tokenToId.size;
  }

  /**
   * Serializes the vocabulary to a JSON file.
   * @param path The file path to save to.
   */
  public save(path: string): void {
    const data = JSON.stringify(Object.fromEntries(this.tokenToId), null, 2);
    fs.writeFileSync(path, data, 'utf-8');
  }

  /**
   * Loads the vocabulary from a JSON file.
   * @param path The file path to load from.
   */
  public load(path: string): void {
    const data = fs.readFileSync(path, 'utf-8');
    const parsed = JSON.parse(data) as Record<string, number>;
    
    this.tokenToId.clear();
    this.idToToken.clear();
    this.nextId = 0;

    const entries = Object.entries(parsed).sort((a, b) => a[1] - b[1]);
    for (const [token, id] of entries) {
      this.tokenToId.set(token, id);
      this.idToToken.set(id, token);
      this.nextId = Math.max(this.nextId, id + 1);
    }
  }
}
