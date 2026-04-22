# docs/PLAN_phase5_inference.md

## What we are building and why
We are building the generation pipeline that allows our trained LLM to actually write text. Because decoder-only transformers generate text one token at a time autoregressively, we must build a Key-Value (KV) Cache. This caches the $K$ and $V$ matrices of past tokens so we only compute attention for the *newest* token, speeding up generation exponentially. We are also building temperature and top-k/top-p samplers to control the creativity of the output.

## File structure that will be created
```text
src/inference/
├── kvcache.ts          # Key-value memory cache
├── sampler.ts          # Token selection algorithms
└── generator.ts        # The master generation loop
```

## Core Classes, Inputs, Outputs, and Purpose

### KVCache (kvcache.ts)
- **Purpose:** Maintains state during a generation run.
- **Methods:** 
  - `update(layer: number, newK: Tensor, newV: Tensor): {K: Tensor, V: Tensor}` -> Appends new tokens to the cached tensors.
  - `clear(): void` -> Frees memory after generation completes.
  - `size(): number` -> Returns the current sequence length.

### Sampler (sampler.ts)
- **Input:** logits (Tensor of vocabulary probabilities)
- **Purpose:** Decides which token to pick next.
- **Methods:**
  - `greedy()` -> Picks the absolute highest probability token (argmax).
  - `temperature(temp: number)` -> Divides logits by temperature before softmax.
  - `topK(k: number)` -> Zeroes out all probabilities except the top K.
  - `topP(p: number)` -> Nucleus sampling (keeps tokens until cumulative probability hits P).

### Generator (generator.ts)
- **Input:** prompt (string), model (LLM), tokenizer (BPE), config (maxTokens, temp, etc.)
- **Output:** generatedText (string)
- **Purpose:** The master orchestration loop. Encodes the prompt, feeds it to the LLM iteratively, manages the KV Cache, samples the next token, checks for [EOS], and decodes the final array back to text.

## Data Flow Diagram (ASCII)
```text
[Input String] ──> [Tokenizer] ──> [Initial Token IDs]
                                         │
 ┌───────────────────────────────────────┘
 │
 ▼
[LLM Forward Pass] <──> [KVCache: Stores past K, V]
 │
 ▼
[Next Token Logits] ──> [Sampler (Temp/Top-K)] ──> [Selected Token ID]
                                                         │
 ┌───────────────────────────────────────────────────────┘
 │
 ├──> If Token == [EOS] or maxSeqLen ──> [STOP]
 │
 └──> Append to Sequence ──> (Loop Back to LLM Forward Pass)
```

## Edge cases to handle
- **Temperature Zero:** If `config.temperature === 0`, the sampler must safely default to `greedy()` to avoid a divide-by-zero error.
- **Context Window Overflow:** The generator must gracefully halt or truncate if the generated sequence plus the prompt length exceeds the model's maxSeqLen (512).
- **KV Cache Memory Leaks:** The Generator must explicitly call `kvcache.clear()` in a finally block to ensure memory is released even if generation throws an error.

## Test cases to write BEFORE coding
1. **Greedy Sampling:** Assert that `sampler.greedy([0.1, 0.8, 0.1])` correctly returns index 1.
2. **Temperature Scaling:** Assert that higher temperatures flatten the logits distribution while a temperature of 1.0 leaves them unchanged.
3. **EOS Detection:** Assert that the generator loop breaks instantly when it samples the `[EOS]` token ID (3).
