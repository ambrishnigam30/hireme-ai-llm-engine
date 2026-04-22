# docs/PLAN_phase7_ui.md

## What we are building and why
We are building a local web server and a sleek frontend interface for HireMe.ai. This allows users to paste their Job Description and Resume into clean text boxes on a webpage, click "Optimize," and watch the LLM stream the ATS-optimized resume and match score directly into their browser, eliminating the need to use the terminal.

## File structure that will be created
```text
├── src/
│   └── api/
│       └── server.ts           # Express.js server wrapping our LLM
├── public/                     # Frontend Assets
│   ├── index.html              # The UI layout
│   ├── styles.css              # Modern, minimalist UX styling
│   └── app.js                  # Frontend logic to handle button clicks
└── scripts/
    └── start_app.ts            # Boot command for the web server
```

## Core Components and Purpose

### server.ts (The Bridge)
- **Purpose:** Creates a local HTTP REST API using `express`. It will listen for `POST /api/optimize` requests, pass the incoming JSON data to our existing Phase 6 Optimizer, and return the generated resume.

### index.html (The Structure)
- **Purpose:** A clean two-column layout. Left side: Input areas for the Job Description and Current Resume. Right side: A large output area for the Optimized Resume and the ATS Match Score ring.

### styles.css (The Polish)
- **Purpose:** Professional, minimalist design. We will use a clean sans-serif font, subtle shadows, and a distinct "loading" state so the user knows the LLM is "thinking."

### app.js (The Interaction)
- **Purpose:** Grabs the text from the inputs, sends it to `server.ts` via `fetch()`, and updates the right column with the final results.

## Data Flow Diagram (ASCII)
```text
[User Browser (index.html)] 
          │
      (Clicks "Optimize")
          │
          ▼
[app.js] ──(POST /api/optimize)──> [server.ts]
                                        │
                                        ▼
                               [Phase 6 Optimizer]
                                        │
                               [Phase 5 Inference]
                                        │
                                        ▼
[Browser displays result] <──(Returns JSON text)──
```
