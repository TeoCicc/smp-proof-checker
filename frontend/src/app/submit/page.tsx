'use client';

import { useState, useMemo } from 'react';

// ── helpers ────────────────────────────────────────────────────────────────

function validateTheoremName(name: string): string | null {
  if (!name.trim()) return 'Theorem name is required.';
  if (!/^[a-zA-Z0-9_]+$/.test(name.trim()))
    return 'Only letters, numbers, and underscores are allowed.';
  return null;
}

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

// ── PR submission types ────────────────────────────────────────────────────

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

interface SubmitResult {
  pullRequestUrl: string;
  branchName: string;
  filePath: string;
  importLine: string;
}

// ── component ──────────────────────────────────────────────────────────────

export default function SubmitPage() {
  const [theoremName, setTheoremName] = useState('');
  const [description, setDescription] = useState('');
  const [leanCode, setLeanCode] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState('');

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

  async function handleCreatePR() {
    setNameTouched(true);
    setCodeTouched(true);
    if (!isValid) return;

    setSubmitStatus('loading');
    setSubmitResult(null);
    setSubmitError('');

    try {
      const res = await fetch('/api/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theoremName, description, leanCode }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string } & Partial<SubmitResult>;

      if (!res.ok || !data.success) {
        setSubmitStatus('error');
        setSubmitError(data.error ?? 'An unexpected error occurred. Please try again.');
      } else {
        setSubmitStatus('success');
        setSubmitResult({
          pullRequestUrl: data.pullRequestUrl ?? '',
          branchName: data.branchName ?? '',
          filePath: data.filePath ?? filePath,
          importLine: data.importLine ?? importLine,
        });
      }
    } catch {
      setSubmitStatus('error');
      setSubmitError('Network error. Check your connection and try again.');
    }
  }

  function handleReset() {
    setSubmitStatus('idle');
    setSubmitResult(null);
    setSubmitError('');
  }

  return (
    <div>
      <h1>Submit a Proof</h1>
      <p>
        Fill in the form below, then click <strong>Create Pull Request</strong>. The app
        will push the generated Lean file to a new branch and open a PR — GitHub Actions
        will verify it with <code>lake build</code> automatically.
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
              onChange={(e) => { setTheoremName(e.target.value); handleReset(); }}
              onBlur={() => setNameTouched(true)}
              disabled={submitStatus === 'loading'}
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
              disabled={submitStatus === 'loading'}
            />
          </div>

          <div className="field">
            <label htmlFor="lean-code">Lean Code *</label>
            <textarea
              id="lean-code"
              rows={10}
              value={leanCode}
              placeholder={`theorem ${theoremName.trim() || 'my_theorem'} : ... := by\n  omega`}
              onChange={(e) => { setLeanCode(e.target.value); handleReset(); }}
              onBlur={() => setCodeTouched(true)}
              disabled={submitStatus === 'loading'}
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
            <span className="info-label">Import Line (added to ProofCollection.lean)</span>
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

      {/* ── Create PR button + result ── */}
      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Create Pull Request</h2>
        <p style={{ marginBottom: '1rem' }}>
          The app will create a branch, commit the proof file, update{' '}
          <code>ProofCollection.lean</code>, and open a pull request automatically.
        </p>

        <button
          className="btn btn-primary"
          onClick={handleCreatePR}
          disabled={submitStatus === 'loading' || submitStatus === 'success'}
          style={{ minWidth: '200px' }}
        >
          {submitStatus === 'loading' ? 'Creating pull request…' : 'Create Pull Request'}
        </button>

        {submitStatus === 'success' && submitResult && (
          <div className="result result-success" style={{ marginTop: '1rem' }}>
            <p className="result-heading">Pull request created</p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <a
                href={submitResult.pullRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cta"
                style={{ marginTop: 0 }}
              >
                View Pull Request →
              </a>
              <button className="btn btn-secondary" onClick={handleReset}>
                Submit another proof
              </button>
            </div>

            <div className="result-section">
              <p className="result-section-title">Submission details</p>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Branch</span>
                  <div className="copy-row">
                    <code className="copy-code">{submitResult.branchName}</code>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">Lean file</span>
                  <div className="copy-row">
                    <code className="copy-code">{submitResult.filePath}</code>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">Import added to ProofCollection.lean</span>
                  <div className="copy-row">
                    <code className="copy-code">{submitResult.importLine}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-section">
              <p className="result-section-title">What happens next</p>
              <ul className="result-list">
                <li>
                  <strong>check-lean</strong> — runs <code>lake build</code> to verify
                  your proof compiles in Lean&nbsp;4.
                </li>
                <li>
                  <strong>build-frontend</strong> — verifies the Next.js app still builds
                  with the updated index.
                </li>
                <li>
                  Both checks must pass and a maintainer must approve the pull request
                  before it can be merged. <strong>Proofs are not auto-merged.</strong>
                </li>
              </ul>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="result result-error" style={{ marginTop: '1rem' }}>
            <p className="result-heading">Submission failed</p>
            <p className="result-error-msg">{submitError}</p>
            <button className="btn btn-secondary" onClick={handleReset}>
              Try again
            </button>
          </div>
        )}
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

      {/* ── Manual checklist (fallback) ── */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '0.4rem' }}>Manual Submission (fallback)</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          If automatic PR creation is unavailable, follow these steps instead.
        </p>
        <ol className="checklist">
          <li>Copy the generated Lean file using the button above.</li>
          <li>
            Create the file at{' '}
            <code>
              {nameIsValid ? filePath : 'lean/ProofCollection/Submissions/YourTheorem.lean'}
            </code>
            .
          </li>
          <li>Paste the copied contents into the file.</li>
          <li>
            Open <code>lean/ProofCollection.lean</code> and add:{' '}
            <code>
              {nameIsValid
                ? importLine
                : 'import ProofCollection.Submissions.YourTheorem'}
            </code>
            .
          </li>
          <li>
            Run <code>lake build</code> inside <code>lean/</code> to verify locally.
          </li>
          <li>
            Commit both files and open a pull request against <code>main</code>.
          </li>
          <li>
            GitHub Actions runs <code>lake build</code> — a green check means accepted.
          </li>
        </ol>
      </div>
    </div>
  );
}
