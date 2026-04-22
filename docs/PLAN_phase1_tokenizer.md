# PLAN: Phase 1 - BPE Tokenizer

## What we are building and why
We are building a custom Byte Pair Encoding (BPE) tokenizer from scratch in TypeScript. The tokenizer is responsible for converting raw text into sequences of integer token IDs (encoding) and vice versa (decoding). This is the fundamental first step of the LLM pipeline, as the model only understands sequences of integers.

We implement it from scratch to deeply understand text representation, vocabulary learning, and subword tokenization, rather than relying on a pre-built tokenizer library.

## File structure that will be created
```text
src/tokenizer/
├── bpe.ts              # Core BPE merge logic and training
├── vocabulary.ts       # Maps strings to token IDs and handles persistence
└── tokenizer.ts        # The main Tokenizer interface for encode/decode
tests/
└── tokenizer.test.ts   # Test suite for Phase 1
```

## Every function/class with its inputs, outputs, and purpose

### 1. `Vocabulary` (vocabulary.ts)
- **State**: `tokenToId` (Map<string, number>), `idToToken` (Map<number, string>)
- `constructor()`: Initializes with special tokens `[PAD]` (0), `[UNK]` (1), `[BOS]` (2), `[EOS]` (3), `[SEP]` (4).
- `addToken(token: string): number`: Adds a new token to the vocab, returns its assigned ID.
- `getToken(id: number): string | undefined`: Retrieves the string token for an ID.
- `getId(token: string): number | undefined`: Retrieves the ID for a string token.
- `size(): number`: Returns the total number of tokens.
- `save(path: string): void`: Serializes vocab to JSON.
- `load(path: string): void`: Loads vocab from JSON.

### 2. `BPE` (bpe.ts)
- **State**: `merges` (Map<string, number>) where string is "A B" and number is the ID of the merged token "AB".
- `train(corpus: string[], vocabSize: number, vocab: Vocabulary): void`: Counts adjacent character pairs, repeatedly merges the most frequent pair, adds the new merged token to `vocab`, and stores the merge rule until `vocabSize` is reached.
- `getMerges(): Map<string, number>`: Exposes the merge rules.

### 3. `Tokenizer` (tokenizer.ts)
- **State**: `vocab` (Vocabulary), `bpe` (BPE)
- `encode(text: string): number[]`: Splits text into base characters, iteratively applies learned BPE merges, and maps the resulting subwords to their integer IDs. Handles unknown characters by assigning `[UNK]`.
- `decode(ids: number[]): string`: Maps token IDs back to strings and concatenates them. Replaces `[UNK]` with a special character or leaves it.
- `encodeBatch(texts: string[]): number[][]`: Runs `encode` on a list of texts.
- `pad(sequences: number[][], maxLen: number): number[][]`: Pads arrays of IDs with the `[PAD]` token up to `maxLen`. If a sequence is longer than `maxLen`, it truncates it.

## Data flow diagrams in ASCII art

### Training Data Flow
```text
[Text Corpus] 
    │
    ▼
[Base Characters (A, B, C)] 
    │
    ▼ (Count Pairs)
[Most Frequent Pair: "A B"] ──> Add to Vocabulary ("AB" = ID 256)
    │
    ▼ (Merge)
[Updated Corpus] ───> Loop until Vocab Size == 8000
```

### Encoding Data Flow
```text
"software engineer" 
    │
    ▼ (Character Split)
["s", "o", "f", "t", "w", "a", "r", "e", " ", "e", "n", "g", "i", "n", "e", "e", "r"]
    │
    ▼ (Apply BPE Merges)
["soft", "ware", " ", "engine", "er"]
    │
    ▼ (Lookup IDs in Vocabulary)
[ 154, 89, 5, 452, 98 ]
```

## Edge cases to handle
- **Unseen characters during encoding**: Must fallback to `[UNK]` token smoothly without crashing.
- **Empty strings**: Encoding `""` should return `[]`.
- **Sequences already longer than `maxLen` during padding**: Must truncate sequence to `maxLen`.
- **Merge ties during training**: If multiple pairs have the same max frequency, pick the first one encountered safely.

## Test cases to write BEFORE coding
1. **Encode text**: Encode "software engineer" -> returns an array of integers.
2. **Decode text**: Decode the previous array -> returns "software engineer".
3. **Round-trip testing**: Verify `decode(encode(text)) === text` on an array of 100 varying sentences.
4. **Vocab constraints**: Assert `vocab.size() === 8000` after training on a dummy dataset.
5. **Special tokens**: Check that IDs 0-4 are correctly reserved and never overwritten.
6. **Batch shape**: `encodeBatch(["hello", "world"])` returns `number[][]`.
7. **Padding/Truncation**: `pad([[1, 2], [1, 2, 3, 4]], 3)` returns `[[1, 2, 0], [1, 2, 3]]`.
