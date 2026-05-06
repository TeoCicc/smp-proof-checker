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

- **Branch protection** is enabled on `main`. Both `check-lean` and `build-frontend` must
  pass before a pull request can be merged. Human review is still required — PRs are not
  auto-merged even when all checks pass.

- **Automatic PR creation confirmed working** — the Submit Proof page calls
  `POST /api/submit-proof`, which creates a branch, commits the proof file, updates
  `ProofCollection.lean`, and opens a pull request. A valid proof PR was tested
  end-to-end and both CI checks passed.

- **Bad-proof blocking confirmed** — a PR containing an invalid Lean proof (both
  manually submitted and auto-created) was tested; `check-lean` failed and the merge
  was blocked as expected.

## Security: GitHub Token

- The GitHub token is stored **only** in `frontend/.env.local` (server-side).
- `frontend/.env.local` is listed in `.gitignore` and must never be committed.
- `frontend/.env.local.example` documents the required variables without real values.
- No env var is prefixed with `NEXT_PUBLIC_` — none of the GitHub credentials are ever
  sent to or accessible from the browser.
- Required variables:
  ```
  GITHUB_TOKEN=<fine-grained PAT: Contents R/W + Pull requests R/W>
  GITHUB_OWNER=<github username or org>
  GITHUB_REPO=smp-proof-checker
  GITHUB_BASE_BRANCH=main
  ```
- When deploying to Vercel, these must be set as Vercel environment variables.

## Monorepo Layout

```text
smp-proof-checker/
├── frontend/                        Next.js 14 TypeScript app
│   ├── .env.local                   Secret env vars — never commit
│   ├── .env.local.example           Template showing required vars
│   └── src/app/
│       ├── page.tsx                 Home
│       ├── submit/page.tsx          Submit Proof (main feature)
│       ├── collection/page.tsx      Collection (hardcoded MVP examples)
│       ├── how-it-works/page.tsx    How It Works (6-step pipeline)
│       ├── about/page.tsx           About
│       └── api/
│           └── submit-proof/
│               └── route.ts         POST handler — GitHub API integration
├── lean/                            Lean 4 Lake project
│   ├── lakefile.lean
│   ├── lean-toolchain               leanprover/lean4:v4.14.0
│   ├── ProofCollection.lean         Root module (lists all imports)
│   └── ProofCollection/
│       ├── Basic.lean               Shared lemmas (add_zero, zero_add, …)
│       └── Submissions/
│           └── Example.lean         Example student submission
├── scripts/                         Placeholder TypeScript scripts
└── .github/workflows/
    └── check-proofs.yml             CI pipeline (check-lean + build-frontend jobs)
```

## Current Frontend State

### Pages

| Page | Route | Status |
|---|---|---|
| Home | `/` | Done — explains the checker, CI gate, and proof collection |
| Submit Proof | `/submit` | Done — auto PR creation + manual fallback checklist |
| Collection | `/collection` | MVP — hardcoded examples, not yet live from repo |
| How It Works | `/how-it-works` | Done — 6-step pipeline with vertical timeline |
| About | `/about` | Done — stack overview and repo layout |

### Submit Proof page (`/submit`)

- Accepts theorem name, optional description, and Lean code.
- Validates: theorem name required, only `[a-zA-Z0-9_]`, Lean code required.
- Converts theorem name to PascalCase (e.g. `frontend_test` → `FrontendTest`).
- Shows the exact file path, import line, and generated Lean file with copy buttons.
- **"Create Pull Request" button** — calls `POST /api/submit-proof`, shows loading state,
  then displays a green success card with a PR link or a red error card with the message.
- Manual submission checklist remains at the bottom as a fallback.

### API route (`POST /api/submit-proof`)

Runs entirely server-side. Steps:

1. Validate `theoremName`, `description`, `leanCode` from the request body.
2. Read `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH` from env.
3. Get the SHA of the base branch tip.
4. Create a new branch named `proof/{theoremName}-{timestamp}`.
5. Check that the proof file does not already exist (returns 409 if it does).
6. Commit the generated `.lean` file to `lean/ProofCollection/Submissions/`.
7. Read `lean/ProofCollection.lean`, append the import line, commit the update.
8. Open a pull request against `main` with a summary of files changed.
9. Return `{ success, pullRequestUrl, branchName, filePath, importLine }`.

### Collection page (`/collection`)

- Shows 5 hardcoded example proofs for the MVP demo.
- Will be replaced with live data fetched from the GitHub API once that is prioritised.

## Full Submission Workflow (current)

1. User fills in the Submit Proof form.
2. Frontend calls `POST /api/submit-proof` (server-side, token never leaves the server).
3. API route creates branch → commits proof file → updates `ProofCollection.lean` → opens PR.
4. GitHub Actions runs `check-lean` (`lake build`) and `build-frontend` on the new PR.
5. If `check-lean` passes, the proof is mathematically valid.
6. A human reviewer merges the PR — proofs are **not** auto-merged.
7. On merge to `main`, the proof becomes part of the permanent collection.

## What Has Not Been Done Yet

- The Collection page is hardcoded; it does not read live data from the repo.
- There is no user authentication — anyone with access to the deployed URL can submit.
- Proofs are not auto-merged after passing CI; a human must review and merge each PR.
- No notification or status polling — after clicking "Create Pull Request" the user must
  check GitHub manually to see whether the CI checks passed.
