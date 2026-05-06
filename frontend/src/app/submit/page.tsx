'use client';

import { useState, useMemo } from 'react';

// ── helpers ────────────────────────────────────────────────────────────────

function validateTheoremName(name: string): string | null {
  if (!name.trim()) return 'Theorem name is required.';
  if (!/^[a-zA-Z0-9_]+$/.test(name.trim()))
    return 'Only letters, numbers, and underscores are allowed.';
  return null;
}

/** "frontend_test" → "FrontendTest" */
function toPascalCase(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function buildLeanFile(leanCode: string): string {
  return `import ProofCollection.Basic

namespace ProofCollection.Submissions

${leanCode}

end ProofCollection.Submissions`;
}

// ── copy hook ──────────────────────────────────────────────────────────────

type CopiedKey = 'file' | 'path' | 'import' | null;

function useCopyState() {
  const [copied, setCopied] = useState<CopiedKey>(null);

  async function copy(text: string, key: CopiedKey) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard not available in non-secure context
    }
  }

  return { copied, copy };
}

// ── component ──────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const [theoremName, setTheoremName] = useState('');
  const [description, setDescription] = useState('');
  const [leanCode, setLeanCode] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  const { copied, copy } = useCopyState();

  const nameError = nameTouched ? validateTheoremName(theoremName) : null;
  const codeError = codeTouched && !leanCode.trim() ? 'Lean code is required.' : null;
  const nameIsValid = validateTheoremName(theoremName) === null;
  const isValid = nameIsValid && leanCode.trim().length > 0;

  const pascalName = useMemo(
    () => (nameIsValid ? toPascalCase(theoremName.trim()) : 'MyTheorem'),
    [theoremName, nameIsValid]
  );

  const filePath = `lean/ProofCollection/Submissions/${pascalName}.lean`;
  const importLine = `import ProofCollection.Submissions.${pascalName}`;
  const previewCode = useMemo(
    () => buildLeanFile(leanCode.trim() || '-- your proof here'),
    [leanCode]
  );

  return (
    <div>
      <h1>Submit a Proof</h1>
      <p>
        Fill in the form to generate your Lean file, then follow the checklist below to
        open a pull request. GitHub Actions will verify the proof with{' '}
        <code>lake build</code>.
      </p>

      {/* ── Form ── */}
      <div className="card">
        <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="field">
            <label htmlFor="theorem-name">Theorem Name *</label>
            <input
              id="theorem-name"
              type="text"
              value={theoremName}
              placeholder="e.g. add_comm_example"
              onChange={(e) => setTheoremName(e.target.value)}
              onBlur={() => setNameTouched(true)}
            />
            {nameError && <span className="error">{nameError}</span>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              placeholder="Brief description of what this proof shows"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="lean-code">Lean Code *</label>
            <textarea
              id="lean-code"
              rows={10}
              value={leanCode}
              placeholder={`theorem ${theoremName.trim() || 'my_theorem'} : ... := by\n  omega`}
              onChange={(e) => setLeanCode(e.target.value)}
              onBlur={() => setCodeTouched(true)}
            />
            {codeError && <span className="error">{codeError}</span>}
          </div>
        </form>
      </div>

      {/* ── File details ── */}
      <div className={`card${nameIsValid ? '' : ' dimmed'}`}>
        <h2 style={{ marginBottom: '1rem' }}>File Details</h2>
        {!nameIsValid && (
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Enter a valid theorem name above to see the generated file details.
          </p>
        )}
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Module / File Name</span>
            <div className="copy-row">
              <code className="copy-code">{pascalName}.lean</code>
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">File Path</span>
            <div className="copy-row">
              <code className="copy-code">{filePath}</code>
              <button
                className={`btn btn-sm ${copied === 'path' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => copy(filePath, 'path')}
              >
                {copied === 'path' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">Import Line (add to ProofCollection.lean)</span>
            <div className="copy-row">
              <code className="copy-code">{importLine}</code>
              <button
                className={`btn btn-sm ${copied === 'import' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => copy(importLine, 'import')}
              >
                {copied === 'import' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Generated file preview ── */}
      <div className="preview-section">
        <div className="preview-header">
          <h2>Generated Lean File</h2>
          <button
            className={`btn ${copied === 'file' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => copy(previewCode, 'file')}
            disabled={!isValid}
            title={isValid ? 'Copy to clipboard' : 'Fix validation errors first'}
          >
            {copied === 'file' ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre className="preview">{previewCode}</pre>
        {!isValid && (nameTouched || codeTouched) && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
            Fix the errors above to enable copying.
          </p>
        )}
      </div>

      {/* ── Submission checklist ── */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>How to Submit</h2>
        <ol className="checklist">
          <li>Copy the generated Lean file using the button above.</li>
          <li>
            Create the file at{' '}
            <code>{nameIsValid ? filePath : 'lean/ProofCollection/Submissions/YourTheorem.lean'}</code>.
          </li>
          <li>Paste the copied contents into the file.</li>
          <li>
            Open <code>lean/ProofCollection.lean</code> and add the import line:{' '}
            <code>{nameIsValid ? importLine : 'import ProofCollection.Submissions.YourTheorem'}</code>.
          </li>
          <li>
            Run <code>lake build</code> inside <code>lean/</code> to verify the proof
            compiles locally.
          </li>
          <li>
            Commit both files and open a pull request against <code>main</code>.
          </li>
          <li>
            GitHub Actions will run <code>lake build</code> automatically — a green check
            means the proof is accepted.
          </li>
        </ol>
        <div className="note" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          <strong>Coming soon:</strong> automatic pull request creation through the GitHub
          API — no manual file copying needed.
        </div>
      </div>
    </div>
  );
}
