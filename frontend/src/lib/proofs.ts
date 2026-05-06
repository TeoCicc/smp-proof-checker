import path from 'path';
import fs from 'fs';

export type SubmittedVia = 'automatic-pr' | 'manual';

export interface ProofEntry {
  theoremName: string;
  moduleName: string;
  description: string;
  filePath: string;
  importLine: string;
  leanCode: string;
  submittedVia: SubmittedVia;
}

// proofs/index.json lives at the repo root, one level above frontend/.
// process.cwd() is the frontend/ directory when Next.js runs.
const INDEX_PATH = path.join(process.cwd(), '..', 'proofs', 'index.json');

export function readProofIndex(): ProofEntry[] {
  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    return JSON.parse(raw) as ProofEntry[];
  } catch {
    return [];
  }
}
