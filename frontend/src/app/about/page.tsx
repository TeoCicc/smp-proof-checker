export default function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>SMP Proof Checker is a school project exploring automated proof verification.</p>

      <div className="card">
        <h2>Stack</h2>
        <ul className="step-list">
          <li>
            <span className="step-num">L</span>
            <span>
              <strong>Lean&nbsp;4 / Lake</strong> — the proof checker. All mathematical
              verification happens here.
            </span>
          </li>
          <li>
            <span className="step-num">N</span>
            <span>
              <strong>Next.js 14</strong> — the frontend. TypeScript, App Router, no
              external UI library.
            </span>
          </li>
          <li>
            <span className="step-num">CI</span>
            <span>
              <strong>GitHub Actions</strong> — runs <code>lake build</code> on every push
              to verify all proofs still compile.
            </span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>Repository layout</h2>
        <pre className="preview" style={{ fontSize: '0.8rem' }}>{`smp-proof-checker/
├── frontend/          Next.js TypeScript app
├── lean/              Lean 4 Lake project
│   └── ProofCollection/
│       ├── Basic.lean
│       └── Submissions/
├── scripts/           Helper TypeScript scripts
└── .github/workflows/ CI pipeline`}</pre>
      </div>
    </div>
  );
}
