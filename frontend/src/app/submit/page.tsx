'use client';

import { useState, useMemo } from 'react';

function validateTheoremName(name: string): string | null {
  if (!name.trim()) return 'Theorem name is required.';
  if (!/^[a-zA-Z0-9_]+$/.test(name.trim()))
    return 'Only letters, numbers, and underscores are allowed.';
  return null;
}

function buildLeanFile(leanCode: string): string {
  return `import ProofCollection.Basic

namespace ProofCollection.Submissions

${leanCode}

end ProofCollection.Submissions`;
}

export default function SubmitPage() {
  const [theoremName, setTheoremName] = useState('');
  const [description, setDescription] = useState('');
  const [leanCode, setLeanCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Only show errors after the user has touched the field
  const [nameTouched, setNameTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  const nameError = nameTouched ? validateTheoremName(theoremName) : null;
  const codeError = codeTouched && !leanCode.trim() ? 'Lean code is required.' : null;

  const isValid = validateTheoremName(theoremName) === null && leanCode.trim().length > 0;

  const previewCode = useMemo(
    () => buildLeanFile(leanCode.trim() || '-- your proof here'),
    [leanCode]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(previewCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available (e.g. non-secure context)
    }
  }

  return (
    <div>
      <h1>Submit a Proof</h1>
      <p>
        Fill in the form below. The generated Lean file is shown in the preview — copy it
        when you are ready to submit.
      </p>

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
              placeholder={`theorem ${theoremName || 'my_theorem'} : ... := by\n  omega`}
              onChange={(e) => setLeanCode(e.target.value)}
              onBlur={() => setCodeTouched(true)}
            />
            {codeError && <span className="error">{codeError}</span>}
          </div>
        </form>
      </div>

      <div className="preview-section">
        <div className="preview-header">
          <h2>Generated Lean File</h2>
          <button
            className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleCopy}
            disabled={!isValid}
            title={isValid ? 'Copy to clipboard' : 'Fix validation errors first'}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre className="preview">{previewCode}</pre>
        {!isValid && (nameTouched || codeTouched) && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
            Fix the errors above to enable copying.
          </p>
        )}
      </div>
    </div>
  );
}
