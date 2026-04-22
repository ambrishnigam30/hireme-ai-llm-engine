# PLAN: Phase 0 - Setup

## What we are building and why
We are initializing the base project structure and development environment for "HireMe.ai", an ATS-optimized resume generator powered by a custom LLM. This phase is crucial to ensure all team members and future development phases have a standardized, strictly-typed TypeScript environment, a consistent testing framework (Jest), and formatting/linting tools (Prettier, ESLint) to maintain code quality. It also includes setting up `@mni-ml/framework` as the core ML dependency.

## File structure that will be created
```text
D:\AI Projects\Building LLM Product
├── docs/
│   └── PLAN_phase0_setup.md    # This plan file
├── src/                        # Main source directory (empty for now)
├── tests/                      # Testing directory (empty for now)
├── scripts/                    # Scripts directory (empty for now)
├── checkpoints/                # Model weights directory (gitignored)
├── data/                       # Downloaded datasets directory (gitignored)
├── .gitignore                  # Git ignore rules
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── jest.config.ts              # Jest configuration for ts-jest
├── tsconfig.json               # TypeScript configuration
├── package.json                # NPM dependencies and scripts
└── README.md                   # Project description
```

## Every function/class with its inputs, outputs, and purpose
In this phase, we are mostly creating configuration files, not application code. However, the conceptual "outputs" of this phase are the scripts in `package.json`:

* `npm run build`: Compiles TypeScript from `src/` to `dist/`
* `npm run test`: Runs Jest test suite
* `npm run lint`: Runs ESLint
* `npm run format`: Runs Prettier

## Data flow diagrams in ASCII art
```text
[Developer]
    │
    ├─ Writes code (.ts) ──> [TypeScript Compiler] ──> [dist/*.js]
    │
    ├─ Writes tests (.test.ts) ──> [Jest + ts-jest] ──> Test Results
    │
    └─ Runs lint/format ──> [ESLint / Prettier] ──> Enforces Code Quality
```

## Edge cases to handle
*   **Git already initialized:** We will run `git init` but handle cases where it might already exist.
*   **Missing directories:** Ensure all required nested directories (e.g., `src/`, `tests/`, `checkpoints/`, `data/`) are explicitly created before moving to Phase 1.
*   **Strict Typing Errors:** Ensure `tsconfig.json` has `strict: true` so all subsequent files enforce strong typing.

## Test cases to write BEFORE coding
*(Note: These are verification steps for the setup phase)*
1. Run `npm run build` -> Should succeed without errors (even if `src/` is empty).
2. Run `npm run test` -> Should succeed (we will create a dummy test to verify Jest is working).
3. Run `npx tsc --noEmit` -> Should succeed with no type errors.
4. Verify `.gitignore` contains `node_modules`, `dist`, `data`, `checkpoints`, and `*.env`.
