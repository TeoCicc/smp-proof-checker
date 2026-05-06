# CLAUDE.md

## Project Overview

This repository is for a school project called `smp-proof-checker`.

The goal is to build a system that accepts math proofs written in Lean 4, checks whether they are logically valid using Lean/Lake, and then allows valid proofs to be accepted into a growing proof collection.

The app should not claim to prove whether any math statement is true by itself. It only checks whether a submitted Lean proof compiles successfully.

## Main Architecture

The project should be organized as a monorepo:

```text
smp-proof-checker/
├── frontend/              # Next.js TypeScript frontend, eventually hosted on Vercel
├── lean/                  # Lean 4 Lake project containing the proof collection
├── scripts/               # Helper scripts for validation/submission
└── .github/workflows/     # GitHub Actions workflows for proof checking

## Current Frontend MVP

The frontend currently generates Lean file previews only. It does not directly submit to GitHub yet.

The manual submission workflow is:
1. User writes a Lean proof in the Submit Proof page.
2. The frontend generates a Lean file preview.
3. The user copies the generated Lean file.
4. The file is added under `lean/ProofCollection/Submissions/`.
5. The new file is imported in `lean/ProofCollection.lean`.
6. `lake build` checks whether the proof is valid.
7. GitHub Actions repeats this check on push or pull request.