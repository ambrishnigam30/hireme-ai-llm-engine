# HireMe.ai - LLM & ATS Optimizer

## Elevator Pitch
**HireMe.ai** is not just an API wrapper around OpenAI. It is a completely custom, from-scratch Decoder-only Transformer model built entirely in TypeScript. The product specifically solves the massive UX problem of Applicant Tracking System (ATS) rejection by natively embedding the LLM with ATS scoring logic. It intelligently restructures raw, messy resumes against strict Job Descriptions using hyper-optimized, autonomous text generation.

---

## System Architecture

The ecosystem was systematically designed and built across 6 distinct phases of LLM infrastructure:

1. **Phase 1: BPE Tokenizer**  
   Implemented Byte-Pair Encoding (BPE) from scratch. Converts raw strings into compressed numerical IDs, reducing sequence length and optimizing vocabulary distribution.

2. **Phase 2: HuggingFace Pipeline**  
   A robust dual-fallback data ingestion system. Uses Python sub-processes dynamically, scaling back to native HTTP Fetch API connections to download and preprocess datasets directly from the HuggingFace Hub.

3. **Phase 3: Decoder-only Transformer**  
   The mathematical core. Built custom Multi-Head Attention mechanisms, Layer Normalization, and Feed-Forward Neural Networks to construct a foundational Transformer matrix architecture mirroring state-of-the-art standards.

4. **Phase 4: Training Loop**  
   Implements an iterative backpropagation orchestrator utilizing Global L2 Norm Gradient Clipping to mathematically prevent exploding gradients, alongside robust matrix memory-management (explicit Tensor disposal) to prevent OOM bottlenecks during epoch cycles.

5. **Phase 5: KV Cache Inference**  
   Engineered a high-performance Key-Value (KV) caching mechanism. By storing past attention keys and values, the autoregressive generation pipeline exponentially speeds up token output while utilizing advanced temperature, top-K, and greedy algorithmic sampling.

6. **Phase 6: The Node CLI Application**  
   The presentation layer. Exposes a streamlined Command Line Interface that parses raw documents, computes $n$-gram keyword intersection ATS scores, manages runaway generation states, and formats a highly professional, human-readable output.

---

## Product Value
* **Automated Keyword Matching:** Employs explicit heuristic algorithms to score raw resume inputs against job descriptions instantly.
* **Real-Time Generation:** Translates complex vector probabilities into beautifully rewritten experiences tailored directly to the JD.
* **Zero-Human Intervention:** Fully autonomous pipeline—input raw files, output an optimized resume and its ATS grade.

---

## Tech Stack
* **Language:** TypeScript
* **Tensor Framework:** `@mni-ml/framework`
* **Testing:** Jest
* **Data ecosystem:** HuggingFace Hub

---

## Quick Start
Run the core CLI generation tool by providing a job description and a resume text file:
```bash
npx ts-node scripts/generate.ts --job jd.txt --resume me.txt
```

---

## About the Architect
Built by an elite Senior AI Product Manager with over 14 years of Product Management experience across AI, SaaS, and EdTech ecosystems. Focused intensely on the design and execution of multi-agent autonomous systems, seamlessly combining deep technical software execution with high-level, business-critical product strategy.
