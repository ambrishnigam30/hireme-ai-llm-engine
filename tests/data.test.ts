import { Downloader } from '../src/data/downloader';
import { Preprocessor } from '../src/data/preprocessor';
import { DataLoader } from '../src/data/dataloader';
import { Tokenizer } from '../src/tokenizer/tokenizer';
import { Vocabulary, BOS_ID, EOS_ID, SEP_ID, PAD_ID } from '../src/tokenizer/vocabulary';
import { BPE } from '../src/tokenizer/bpe';

describe('Phase 2: Dataset Pipeline', () => {
  let tokenizer: Tokenizer;

  beforeAll(() => {
    const vocab = new Vocabulary();
    vocab.addToken('J'); vocab.addToken('O'); vocab.addToken('B'); vocab.addToken(':');
    vocab.addToken('R'); vocab.addToken('E'); vocab.addToken('S'); vocab.addToken('U');
    vocab.addToken('M'); vocab.addToken('P'); vocab.addToken('T'); vocab.addToken('I');
    vocab.addToken('Z'); vocab.addToken('D'); vocab.addToken(' '); vocab.addToken('e');
    const bpe = new BPE();
    tokenizer = new Tokenizer(vocab, bpe);
  });

  it('1. Downloader gracefully handles missing python dataset module', async () => {
    const downloader = new Downloader();
    // Use an invalid dataset to simulate failure
    await expect(downloader.downloadDataset('invalid_dataset_name_test/123', './data_test'))
      .rejects.toThrow();
  });

  it('2. Text Cleaning: removes HTML and normalizes spaces', () => {
    const preprocessor = new Preprocessor(tokenizer);
    const cleaned = preprocessor.cleanText('<p>Hello</p>   \n world  ');
    expect(cleaned).toBe('Hello world');
  });

  it('3. Format Pair: generates exact sequence layout', () => {
    const preprocessor = new Preprocessor(tokenizer);
    const pair = preprocessor.formatPair('Dev', 'Bad Resume', 'Good Resume', 512);
    
    // Check it starts with BOS
    expect(pair.inputIds[0]).toBe(BOS_ID);
    // Check it ends with SEP for input, EOS for target
    expect(pair.inputIds[pair.inputIds.length - 1]).toBe(SEP_ID);
    expect(pair.targetIds[0]).toBe(BOS_ID);
    expect(pair.targetIds[pair.targetIds.length - 1]).toBe(EOS_ID);
  });

  it('4. Tokenization & Truncation: limits to maxTokens', () => {
    const preprocessor = new Preprocessor(tokenizer);
    const pair = preprocessor.formatPair('Very long job description', 'Very long weak resume', 'Very long strong resume', 10);
    
    expect(pair.inputIds.length).toBe(10);
    expect(pair.targetIds.length).toBe(10);
    
    // Enforces special token tail even on truncate
    expect(pair.inputIds[9]).toBe(SEP_ID);
    expect(pair.targetIds[9]).toBe(EOS_ID);
  });

  it('5. DataLoader Batching sizes correctly', () => {
    const mockData = Array.from({ length: 100 }, (_, i) => ({ inputIds: [i], targetIds: [i] }));
    const loader = new DataLoader(mockData, 32, 5);
    
    const batch1 = loader.nextBatch();
    expect(batch1).not.toBeNull();
    expect(batch1!.inputIds.length).toBe(32);
    
    loader.nextBatch(); // 32
    loader.nextBatch(); // 32
    
    const batch4 = loader.nextBatch(); // 4 remaining
    expect(batch4!.inputIds.length).toBe(4);
    
    expect(loader.nextBatch()).toBeNull();
  });

  it('6. Attention Mask assigns 0 to padding', () => {
    const mockData = [
      { inputIds: [1, 2, 3], targetIds: [4, 5, 6] }
    ];
    const loader = new DataLoader(mockData, 1, 5);
    const batch = loader.nextBatch()!;
    
    expect(batch.inputIds[0]).toEqual([1, 2, 3, PAD_ID, PAD_ID]);
    expect(batch.attentionMask[0]).toEqual([1, 1, 1, 0, 0]);
  });
});
