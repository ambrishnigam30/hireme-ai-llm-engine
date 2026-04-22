# PLAN: Phase 3 - Transformer Model

## What we are building and why
We are building a decoder-only, GPT-style Transformer architecture. This is the core neural network that learns to understand the input sequence (`JOB ... RESUME ...`) and auto-regressively generate the output sequence (`OPTIMIZED ...`). 

Instead of using a high-level library like HuggingFace `transformers`, we are building the neural network from scratch using `@mni-ml/framework`'s PyTorch-like primitives (`Module`, `Linear`, `Tensor`, etc.). This gives us full control over the architecture, allowing us to implement Key-Value (KV) caching later for fast inference.

## File structure that will be created
```text
src/model/
├── embedding.ts        # Token + positional embeddings
├── attention.ts        # Multi-head causal self-attention
├── feedforward.ts      # Position-wise FFN
├── transformer.ts      # Full decoder-only transformer block
└── llm.ts              # Complete LLM model class
tests/
└── model.test.ts       # Test suite for Phase 3
```

## Every function/class with its inputs, outputs, and purpose

### 1. `Embedding` (embedding.ts)
- **Extends:** `Module` (from `@mni-ml/framework`)
- **State:** `tokenEmbedding` (Embedding layer: `vocabSize` × `dModel`), `positionEmbedding` (pre-computed sinusoidal tensor: `maxSeqLen` × `dModel`)
- `forward(tokenIds: Tensor): Tensor`
  - **Inputs:** Token indices tensor of shape `(batch, seqLen)`
  - **Outputs:** Embedded tensor of shape `(batch, seqLen, dModel)`
  - **Purpose:** Converts integer IDs to dense vectors and adds positional information.

### 2. `MultiHeadAttention` (attention.ts)
- **Extends:** `Module`
- **State:** `qProj`, `kProj`, `vProj`, `outProj` (Linear layers: `dModel` → `dModel`)
- `forward(x: Tensor, mask?: Tensor): Tensor`
  - **Inputs:** `x` of shape `(batch, seqLen, dModel)`, optional `mask`.
  - **Outputs:** Attended tensor `(batch, seqLen, dModel)`
  - **Purpose:** Applies causal self-attention (each token only looks at past tokens). Uses scale factor `1/sqrt(dModel/nHeads)` and applies a causal mask (upper triangular `-Infinity`).

### 3. `FeedForward` (feedforward.ts)
- **Extends:** `Module`
- **State:** `linear1` (Linear: `dModel` → `dFF`), `linear2` (Linear: `dFF` → `dModel`)
- `forward(x: Tensor): Tensor`
  - **Inputs:** `x` of shape `(batch, seqLen, dModel)`
  - **Outputs:** Transformed tensor `(batch, seqLen, dModel)`
  - **Purpose:** Position-wise non-linear transformation. Uses ReLU activation after `linear1`.

### 4. `TransformerBlock` (transformer.ts)
- **Extends:** `Module`
- **State:** `attention` (MultiHeadAttention), `ff` (FeedForward)
- `forward(x: Tensor, mask?: Tensor): Tensor`
  - **Inputs:** `x`, `mask`
  - **Outputs:** Processed tensor `(batch, seqLen, dModel)`
  - **Purpose:** Combines attention and feed-forward with residual connections and `layerNorm` (pre-norm architecture).

### 5. `LLM` (llm.ts)
- **Extends:** `Module`
- **State:** `embedding` (Embedding), `blocks` (Array of `TransformerBlock`), `lmHead` (Linear: `dModel` → `vocabSize`)
- `forward(tokenIds: Tensor): Tensor`
  - **Inputs:** Token indices `(batch, seqLen)`
  - **Outputs:** Logits tensor `(batch, seqLen, vocabSize)`
- `countParameters(): number`
  - **Purpose:** Recursively calculates the number of trainable parameters in the model.
- `save(path: string) / load(path: string)`
  - **Purpose:** Saves/loads model weights using `@mni-ml/framework` state dictionary serialization.

## Data flow diagrams in ASCII art

```text
[Input Token IDs: (batch, seqLen)]
       │
       ▼
[Embedding Layer + Positional Encoding] 
       │
       ▼ (x6 Layers)
┌─────────────────────────────────────┐
│ ┌─► [LayerNorm] ──► [Masked MHA] ──+│ (Residual Add)
│ │                                  ││
│ └─► [LayerNorm] ──► [FeedForward] ─+│ (Residual Add)
└─────────────────────────────────────┘
       │
       ▼
[Final LayerNorm]
       │
       ▼
[LM Head Projection (dModel -> VocabSize)]
       │
       ▼
[Logits: (batch, seqLen, vocabSize)]
```

## Edge cases to handle
- **Variable Sequence Lengths:** Causal mask generation must dynamically slice to `seqLen` to avoid dimension mismatch.
- **Batched Dimensions during Attention:** Reshaping for Multi-Head Attention must properly handle `(batch, seqLen, heads, headDim)` permutations securely using `Tensor.view()` and `Tensor.permute()`.
- **Softmax Underflow:** Masking out future tokens must use `-Infinity` (or an extremely large negative number like `-1e9`) before the Softmax operation.

## Test cases to write BEFORE coding
1. **Embedding Layer:** Input `[2, 10]` → Output shape `[2, 10, dModel]`.
2. **Attention Causal Masking:** Ensure output shape is `[2, 10, dModel]` and that no NaNs propagate from softmaxing `-Infinity`.
3. **FeedForward Shape:** Input `[2, 10, dModel]` → Output shape `[2, 10, dModel]`.
4. **LLM Forward Pass:** Full model accepts `[2, 10]` → Output logits shape `[2, 10, vocabSize]`.
5. **Parameter Count Verification:** `countParameters()` should return roughly 10M-15M for our config.
