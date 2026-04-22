# docs/PLAN_phase6_product.md

## What we are building and why
We are building the **HireMe.ai Application Layer**. A raw LLM cannot be used directly by an end-user because it expects perfectly formatted token arrays and special tags. This phase builds the bridge: a CLI tool that accepts standard text files (a messy resume and a job description), parses them, calculates a baseline ATS (Applicant Tracking System) score, feeds the prompt to our Phase 5 Inference Engine, and formats the generated output into a clean, professional resume.

## File structure that will be created
```text
src/product/
├── parser.ts           # Extracts structure from raw text
├── optimizer.ts        # Orchestrates the LLM and calculates ATS score
└── formatter.ts        # Cleans and structures the final output
scripts/
└── generate.ts         # The executable CLI application
```

## Core Classes, Inputs, Outputs, and Purpose

### Parser (parser.ts)
- **Purpose:** Cleans raw text inputs and formats them for the LLM.
- **Methods:**
  - `parseJobDescription(text: string): JobDescription` -> Extracts key skills, title, and requirements using regex heuristics.
  - `parseResume(text: string): Resume` -> Extracts the user's current experience, education, and skills.
  - `buildPrompt(jd: JobDescription, resume: Resume): string` -> Constructs the strict `[BOS] JOB: ... [SEP] RESUME: ... [SEP]` prompt.

### Optimizer (optimizer.ts)
- **Purpose:** The brain of the product.
- **Methods:**
  - `scoreATS(jd: JobDescription, resume: Resume): number` -> Calculates a 0-100 score based on n-gram keyword overlap between the JD and the resume.
  - `optimizeResume(jd: JobDescription, resume: Resume, generator: Generator): string` -> Feeds the parsed prompt to the Phase 5 generator and captures the output.

### Formatter (formatter.ts)
- **Purpose:** Presentation layer.
- **Methods:**
  - `formatOutput(optimizedText: string, atsScore: number): string` -> Strips out any trailing `[EOS]` tags, fixes whitespace, and injects the ATS match score at the top of the document.

## Data Flow Diagram (ASCII)
```text
[User CLI Command: --job jd.txt --resume me.txt]
                         │
                         ▼
[Parser] ──> Extracts Skills & Cleans Text ──> Formats `[BOS]...[SEP]`
                         │
                         ▼
[Optimizer] ──> Computes Initial ATS Score (e.g., 45%)
            ──> Triggers [Phase 5 LLM Generator]
                         │
                         ▼
[LLM Generates New Resume Text autoregressively]
                         │
                         ▼
[Formatter] ──> Cleans output, appends final ATS Score (e.g., 92%)
                         │
                         ▼
[Writes to `optimized_resume.txt`]
```

## Edge cases to handle
- **LLM Hallucination / Runaway Generation:** The LLM might forget to output an `[EOS]` token. We must pass a strict `maxNewTokens` limit to the Generator to prevent infinite loops.
- **Missing Input Files:** The CLI must gracefully catch `ENOENT` (File Not Found) errors if the user passes a wrong file path, returning a human-readable error instead of a stack trace.
- **Zero Keyword Match:** If a user submits a resume for a "Chef" to a "Software Engineer" JD, the ATS score might be 0. The optimizer should handle zero-division or empty set comparisons safely.

## Test cases to write BEFORE coding
1. **ATS Scoring:** `scoreATS("React Node JS", "I know React")` should mathematically return a partial score, not 0 or 100.
2. **Prompt Construction:** Assert that `buildPrompt` strictly includes the `[BOS]` and `[SEP]` tokens in the exact locations expected by the training data.
3. **CLI Arguments:** Mock `process.argv` to ensure the script properly rejects executions missing the `--job` or `--resume` flags.
