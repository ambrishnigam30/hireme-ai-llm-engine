# PLAN: Phase 4 - Training Loop

## What we are building and why
We are building the `Trainer` orchestration class. This module connects the `DataLoader` (from Phase 2) with our `LLM` model (from Phase 3) to execute the backpropagation training loop. It computes Cross-Entropy loss, applies an optimizer, and systematically monitors validation metrics.

Given the constraints of training an LLM locally or on Colab, we must implement robust safeguards:
- **Gradient Clipping** to prevent exploding gradients.
- **Memory Management** to prevent OOM (Out Of Memory) leaks during long epochs.
- **Checkpointing** to securely save weights at periodic intervals so we don't lose progress.

## File structure that will be created
```text
src/training/
├── optimizer.ts        # Optimizer configurations (AdamW wrapper if needed)
├── loss.ts             # Cross Entropy sequence loss calculator
└── trainer.ts          # Core training loop orchestrator
scripts/
└── train.ts            # CLI execution script for the training process
tests/
└── training.test.ts    # Test suite for Phase 4
```

## Every function/class with its inputs, outputs, and purpose

### 1. `LossFunction` (loss.ts)
- `crossEntropySequenceLoss(logits: Tensor, targets: Tensor, ignoreIndex: number = 0): Tensor`
  - **Inputs:** `logits` [batch, seqLen, vocabSize], `targets` [batch, seqLen].
  - **Outputs:** Scalar loss `Tensor`.
  - **Purpose:** Computes standard language modeling cross-entropy. Safely ignores padding tokens (`PAD_ID === 0`) to prevent padded sequences from skewing the loss calculations.

### 2. `Trainer` (trainer.ts)
- **State:** `model`, `trainLoader`, `valLoader`, `optimizer`, `epochs`, `clipGradNorm`.
- `trainEpoch(): number`
  - **Purpose:** Iterates exactly once through the `trainLoader`. Performs `.forward()`, computes loss, calls `.backward()`, clips gradients, steps the optimizer, and zeros gradients. Returns average epoch training loss.
- `evaluate(): number`
  - **Purpose:** Freezes gradients. Runs a forward pass over `valLoader` to compute unbiased validation loss.
- `train(): void`
  - **Purpose:** The main event loop. Loops over `epochs`, calling `trainEpoch()` and `evaluate()`. Tracks the best validation score and writes `checkpoint.bin` utilizing `model.save()`. 

## Data flow diagrams in ASCII art

```text
[DataLoader Batch] ──► { inputIds, targetIds, mask }
       │
       ▼
[LLM Forward Pass] ──► [Logits]
       │                 │
       ▼                 ▼
[Loss.ts] ◄──(crossEntropy)── [Target IDs]
       │
       ▼ (Scalar Loss)
[Loss.backward()]
       │
       ▼ (Gradients computed)
[Gradient Clipping]
       │
       ▼
[Optimizer.step()] ──► [Weights Updated]
       │
       ▼
[Optimizer.zeroGrad()]
```

## Edge cases to handle
- **Memory Leaks:** If the `@mni-ml/framework` requires manual explicit tensor destruction, we must run `.dispose()` or `.free()` on the logits and loss tensors at the end of each iteration loop.
- **Exploding Gradients:** Must apply a `global_norm` calculation to scale gradients down if they exceed a specific threshold (e.g., `1.0`).
- **Padded Loss:** Sequence padding tokens MUST be masked out of the Cross-Entropy calculation using the attention mask or an `ignoreIndex`.

## Test cases to write BEFORE coding
1. **Mock Training Step:** Execute one forward/backward pass and ensure parameters physically change.
2. **Loss Masking:** Logits matching target arrays but containing `PAD_ID` correctly yield 0 partial loss for those indexes.
3. **Validation Loop:** Ensure validation loop does not call `.backward()` or `.step()`.
