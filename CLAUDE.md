# CLAUDE.md

## Project Overview

This repository is for a school project called `smp-proof-checker`.

The goal is to build a system that accepts math proofs written in Lean 4, checks whether
they are logically valid using Lean/Lake, and then allows valid proofs to be accepted into
a growing proof collection.

The app does not claim to prove whether any math statement is true by itself — it only
checks whether a submitted Lean proof compiles successfully.

## Confirmed Working

- **Lean project** builds locally with `cd lean && lake build`. All theorems in
  `ProofCollection/Basic.lean` and `ProofCollection/Submissions/Example.lean` compile
  cleanly under `leanprover/lean4:v4.14.0`.

- **GitHub Actions** runs two jobs on every push and pull request:
  - `check-lean` — runs `lake build` inside `lean/`
  - `build-frontend` — type-checks and builds the Next.js app

- **Branch protection** is enabled on `main`. A pull request cannot be merged if either
  `check-lean` or `build-frontend` fails.

- **Bad-proof blocking confirmed** — a PR containing an invalid Lean proof was tested;
  `check-lean` failed and the merge was blocked as expected.

## Monorepo Layout

```text
smp-proof-checker/
├── frontend/                   Next.js 14 TypeScript app (hosted on Vercel eventually)
│   └── src/app/
│       ├── page.tsx            Home
│       ├── submit/page.tsx     Submit Proof (main feature)
│       ├── collection/page.tsx Placeholder
│       └── about/page.tsx      Placeholder
├── lean/                       Lean 4 Lake project
│   ├── lakefile.lean
│   ├── lean-toolchain          leanprover/lean4:v4.14.0
│   ├── ProofCollection.lean    Root module (lists all imports)
│   └── ProofCollection/
│       ├── Basic.lean          Shared lemmas (add_zero, zero_add, …)
│       └── Submissions/
│           └── Example.lean    Example student submission
├── scripts/                    Placeholder TypeScript scripts
└── .github/workflows/
    └── check-proofs.yml        CI pipeline (check-lean + build-frontend jobs)
```

## Current Frontend MVP

The Submit Proof page (`/submit`) currently:

- Accepts a theorem name, optional description, and Lean code.
- Validates: theorem name required, only `[a-zA-Z0-9_]`, Lean code required.
- Generates a suggested module name in PascalCase (e.g. `frontend_test` → `FrontendTest`).
- Shows the exact file path: `lean/ProofCollection/Submissions/<Name>.lean`.
- Shows the exact import line: `import ProofCollection.Submissions.<Name>`.
- Renders a complete Lean file preview with the correct namespace wrapper.
- Provides copy-to-clipboard buttons for the file contents, file path, and import line.
- Shows a 7-step manual submission checklist.

The frontend does **not** push to GitHub automatically.

## Manual Submission Workflow (current)

1. User writes a Lean proof in the Submit Proof page.
2. The frontend generates a Lean file preview with correct namespace and imports.
3. The user copies the generated file and creates it at the suggested path under
   `lean/ProofCollection/Submissions/`.
4. The user adds the import line to `lean/ProofCollection.lean`.
5. `lake build` is run locally to verify the proof compiles.
6. The user opens a pull request.
7. GitHub Actions runs `lake build` — a green check means the proof is accepted.

## Future Work

- **Automatic PR creation** via the GitHub API: the frontend will POST the generated file
  contents to a backend endpoint that opens a pull request on behalf of the user.
  GitHub Actions then acts as the proof-checker gate automatically.
