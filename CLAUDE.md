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
│       ├── collection/page.tsx Collection (hardcoded MVP examples)
│       ├── how-it-works/page.tsx How It Works (6-step pipeline)
│       └── about/page.tsx      About
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

## Current Frontend State

### Pages

| Page | Route | Status |
|---|---|---|
| Home | `/` | Done — explains the checker, GitHub Actions gate, and proof collection |
| Submit Proof | `/submit` | Done — full form with preview, file details, and checklist |
| Collection | `/collection` | MVP — hardcoded example proofs, not yet live from repo |
| How It Works | `/how-it-works` | Done — 6-step pipeline with vertical timeline |
| About | `/about` | Done — stack overview and repo layout |

### Submit Proof page (`/submit`)

- Accepts theorem name, optional description, and Lean code.
- Validates: theorem name required, only `[a-zA-Z0-9_]`, Lean code required.
- Converts theorem name to PascalCase for the module name (e.g. `frontend_test` → `FrontendTest`).
- Shows the exact file path: `lean/ProofCollection/Submissions/<Name>.lean`.
- Shows the exact import line: `import ProofCollection.Submissions.<Name>`.
- Renders a complete Lean file preview with the correct namespace wrapper.
- Copy-to-clipboard buttons for the file contents, file path, and import line.
- 7-step manual submission checklist.
- Note that automatic GitHub PR creation is planned.

### Collection page (`/collection`)

- Currently shows 5 hardcoded example proofs (`add_zero`, `zero_add`, `add_self`,
  `add_comm_example`, `add_assoc_example`).
- Marked clearly as MVP examples.
- Will be replaced with live data from the repo once the GitHub API is integrated.

The frontend does **not** push to GitHub or create pull requests automatically.

## Manual Submission Workflow (current)

1. User writes a Lean proof on the Submit Proof page.
2. The frontend generates a Lean file preview with the correct namespace and imports.
3. The user copies the generated file and creates it at the suggested path under
   `lean/ProofCollection/Submissions/`.
4. The user adds the import line to `lean/ProofCollection.lean`.
5. `lake build` is run locally to verify the proof compiles.
6. The user opens a pull request.
7. GitHub Actions runs `lake build` — a green check means the proof is accepted.

## Next Goal: Option B — Automatic GitHub PR Creation

The next major milestone is removing the manual steps above. The plan:

1. Add a **Next.js API route** (`/api/submit`) that receives the theorem name,
   description, and Lean code from the frontend form.
2. The API route uses the **GitHub API** (via a server-side token) to:
   - Create a new branch.
   - Commit the generated `.lean` file to `lean/ProofCollection/Submissions/`.
   - Update `lean/ProofCollection.lean` to add the import line.
   - Open a pull request against `main`.
3. GitHub Actions then runs `lake build` automatically on the new PR.
4. Branch protection accepts or rejects the proof — no manual steps needed.

A `GITHUB_TOKEN` (fine-grained, scoped to this repo) will be stored as a Vercel
environment variable and never exposed to the browser.
