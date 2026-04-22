# PLAN: Phase 2 - Dataset Pipeline

## What we are building and why
We are building a comprehensive Data Pipeline that acquires, cleans, formats, and serves training data to our LLM. Good data is the foundation of any ML model. Our model aims to optimize resumes for specific job descriptions, so we need pairs of (Job Description + Weak Resume) mapping to (Strong ATS-Optimized Resume). 

The pipeline will:
1. Download datasets from HuggingFace.
2. Clean the HTML and normalize formatting.
3. Construct the specific input/output prompt sequences.
4. Tokenize and batch the sequences for the training loop.

## File structure that will be created
```text
src/data/
├── downloader.ts       # HuggingFace dataset downloader (Python subprocess wrapper)
├── preprocessor.ts     # Cleans text, tokenizes, and formats into input-output pairs
└── dataloader.ts       # Iterates over dataset, shuffles, and serves batches
scripts/
└── download_data.ts    # CLI executable to run the downloader
tests/
└── data.test.ts        # Test suite for Phase 2
```

## Every function/class with its inputs, outputs, and purpose

### 1. `Downloader` (downloader.ts)
- `downloadDataset(datasetId: string, outputDir: string): Promise<string>`
  - **Inputs:** HuggingFace dataset string (e.g., `"MikePfunk28/resume-training-dataset"`), target directory.
  - **Outputs:** Path to the saved JSONL file.
  - **Purpose:** Spawns a Python subprocess using `huggingface_hub` or the `datasets` library to securely download the dataset without requiring manual API calls, and saves it locally.

### 2. `Preprocessor` (preprocessor.ts)
- **State:** Tokenizer instance.
- `cleanText(text: string): string`
  - **Purpose:** Strips HTML tags, trims whitespace, standardizes line breaks.
- `formatPair(jobDesc: string, weakResume: string, strongResume: string): { input: string, target: string }`
  - **Purpose:** Constructs:
    - Input: `[BOS] JOB: <job_description> [SEP] RESUME: <weak_resume> [SEP]`
    - Target: `[BOS] OPTIMIZED: <strong_resume> [EOS]`
- `processDataset(jsonlPath: string, maxTokens: number): { train: any[], val: any[], test: any[] }`
  - **Purpose:** Iterates the raw data, cleans it, formats the prompts, converts them to token IDs via the tokenizer, truncates them to `maxTokens`, and splits the data into 80/10/10 buckets.

### 3. `DataLoader` (dataloader.ts)
- **State:** Array of processed samples, `batchSize`, `maxLen`, current index.
- `constructor(data: any[], batchSize: number, maxLen: number)`
- `shuffle(): void`
  - **Purpose:** Randomizes the dataset order (essential for epoch training).
- `nextBatch(): { inputIds: number[][], targetIds: number[][], attentionMask: number[][] } | null`
  - **Purpose:** Yields the next `batchSize` chunk of data. `targetIds` are identical to `inputIds` but typically shifted by 1 in the training loop. The attention mask contains `1` for real tokens and `0` for `[PAD]`.

## Data flow diagrams in ASCII art

```text
[HuggingFace Hub]
       │
       ▼ (Downloader via Python)
[Raw JSONL Files (data/)]
       │
       ▼ (Preprocessor.cleanText & formatPair)
[Cleaned String Pairs]
       │
       ▼ (Tokenizer.encode & truncate)
[Token ID Arrays] ──> [Train / Val / Test Splits]
       │
       ▼ (DataLoader)
[Batches: { inputIds, targetIds, attentionMask }]
       │
       ▼
[Transformer Training Loop]
```

## Edge cases to handle
- **Missing Python/HF Libraries:** Ensure the downloader gracefully reports missing Python dependencies (`datasets`, `huggingface_hub`) instead of crashing vaguely.
- **Missing Dataset Fields:** If a resume dataset lacks a "job description", we must pad it or skip the row safely.
- **Overly Long Text:** Resumes can be huge. We must cleanly truncate strings before appending `[EOS]` or `[SEP]` so the special tokens are always present at the end of the array.
- **Data Leakage:** Shuffle must occur *after* the train/val/test split or we must ensure the split logic is fully mutually exclusive.

## Test cases to write BEFORE coding
1. **Downloader Mock:** Mock the Python subprocess and ensure `downloadDataset` resolves a valid path.
2. **Text Cleaning:** `cleanText("<p>Hello</p>  \n world")` === `"Hello \n world"`.
3. **Format Pair:** Output strictly matches `[BOS] JOB: ... [SEP] RESUME: ... [SEP]` structure.
4. **Tokenization & Truncation:** Ensure processed pair length never exceeds `maxTokens`.
5. **DataLoader Batching:** Requesting batch size 32 returns exactly 32 sequences (unless it's the final batch).
6. **Attention Mask:** Mask has `0`s wherever `[PAD]` exists in the `inputIds`, and `1`s elsewhere.
