# smp-proof-checker

A school project that accepts Lean 4 math proof submissions, checks them with Lake/Lean, and displays the results in a web frontend.

## Monorepo layout

```
smp-proof-checker/
├── frontend/          # Next.js 14 TypeScript app
├── lean/              # Lean 4 Lake project (proof checker)
├── scripts/           # TypeScript helper scripts
└── .github/workflows/ # GitHub Actions CI
```

## Quick start

### Lean project

Requires [elan](https://github.com/leanprover/elan) (Lean version manager).

```bash
cd lean
lake build
```

### Frontend

Requires Node.js ≥ 20.

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### Scripts

```bash
cd scripts
npm install
npx ts-node check-proof.ts <path/to/proof.lean>
```

## CI

GitHub Actions runs on every push and pull request:

- **check-lean** — builds the Lean project with `lake build`
- **build-frontend** — type-checks and builds the Next.js app
