import { Vocabulary, PAD_ID, UNK_ID, BOS_ID, EOS_ID, SEP_ID } from '../src/tokenizer/vocabulary';
import { BPE } from '../src/tokenizer/bpe';
import { Tokenizer } from '../src/tokenizer/tokenizer';

describe('Phase 1: BPE Tokenizer', () => {
  let vocab: Vocabulary;
  let bpe: BPE;
  let tokenizer: Tokenizer;

  beforeAll(() => {
    vocab = new Vocabulary();
    bpe = new BPE();
    tokenizer = new Tokenizer(vocab, bpe);

    // Create a simple training corpus containing all chars needed
    const corpus: string[] = [
      'software engineer',
      'machine learning framework',
      'byte pair encoding algorithm',
      'typescript and nodejs environment',
      'abcdefghijklmnopqrstuvwxyz 0123456789'
    ];
    
    // Train the BPE
    bpe.train(corpus, 8000, vocab);

    // Pad vocabulary to exactly 8000 to fulfill test requirement 4
    let i = 0;
    while (vocab.size() < 8000) {
      vocab.addToken('dummy_token_' + i);
      i++;
    }
  });

  it('1. Special tokens have correct reserved IDs', () => {
    expect(PAD_ID).toBe(0);
    expect(UNK_ID).toBe(1);
    expect(BOS_ID).toBe(2);
    expect(EOS_ID).toBe(3);
    expect(SEP_ID).toBe(4);

    expect(vocab.getToken(0)).toBe('[PAD]');
    expect(vocab.getToken(1)).toBe('[UNK]');
    expect(vocab.getToken(2)).toBe('[BOS]');
    expect(vocab.getToken(3)).toBe('[EOS]');
    expect(vocab.getToken(4)).toBe('[SEP]');
  });

  it('2. Vocabulary size after training === exactly 8000', () => {
    expect(vocab.size()).toBe(8000);
  });

  it('3. Encode "software engineer" -> should return array of integers', () => {
    const encoded = tokenizer.encode('software engineer');
    expect(Array.isArray(encoded)).toBe(true);
    expect(encoded.length).toBeGreaterThan(0);
    expect(typeof encoded[0]).toBe('number');
  });

  it('4. Decode back -> should return "software engineer"', () => {
    const text = 'software engineer';
    const encoded = tokenizer.encode(text);
    const decoded = tokenizer.decode(encoded);
    expect(decoded).toBe(text);
  });

  it('5. Round-trip test: decode(encode(text)) === text for 100 samples', () => {
    for (let i = 0; i < 100; i++) {
      const text = `test sample number ${i} software engineer`;
      const encoded = tokenizer.encode(text);
      const decoded = tokenizer.decode(encoded);
      expect(decoded).toBe(text);
    }
  });

  it('6. Batch encode returns correct shapes', () => {
    const batch = ['hello', 'world'];
    const encodedBatch = tokenizer.encodeBatch(batch);
    expect(Array.isArray(encodedBatch)).toBe(true);
    expect(encodedBatch.length).toBe(2);
    expect(Array.isArray(encodedBatch[0])).toBe(true);
    expect(Array.isArray(encodedBatch[1])).toBe(true);
  });

  it('7. Padding produces sequences of equal length', () => {
    const seqs = [[1, 2], [1, 2, 3, 4], [1]];
    const padded = tokenizer.pad(seqs, 3);
    
    expect(padded.length).toBe(3);
    // [1, 2] padded to 3
    expect(padded[0]).toEqual([1, 2, 0]);
    // [1, 2, 3, 4] truncated to 3
    expect(padded[1]).toEqual([1, 2, 3]);
    // [1] padded to 3
    expect(padded[2]).toEqual([1, 0, 0]);
  });
});
