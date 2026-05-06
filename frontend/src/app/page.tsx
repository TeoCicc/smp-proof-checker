import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>SMP Proof Checker</h1>
      <p>
        Submit a Lean&nbsp;4 math proof and have it verified by the real Lean compiler.
        Valid proofs are accepted into a shared collection.
      </p>

      <div className="features">
        <div className="feature">
          <h3>Lean&nbsp;4 &amp; Lake</h3>
          <p>
            The actual proof checker. Your submission is compiled by Lean — if it builds,
            the proof is mathematically valid.
          </p>
        </div>
        <div className="feature">
          <h3>GitHub Actions</h3>
          <p>
            Runs <code>lake build</code> automatically on every pull request. A failed
            check blocks the merge; a passing check approves it.
          </p>
        </div>
        <div className="feature">
          <h3>Proof Collection</h3>
          <p>
            Accepted proofs live in <code>ProofCollection/Submissions/</code> and are
            visible to everyone on the Collection page.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>How submission works (current)</h2>
        <ul className="step-list">
          <li>
            <span className="step-num">1</span>
            <span>Write your theorem and proof in the Submit Proof page.</span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>
              The app generates the correctly formatted Lean file, file path, and import
              line.
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>
              Copy the file into <code>lean/ProofCollection/Submissions/</code> and add
              the import to <code>ProofCollection.lean</code>.
            </span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span>
              Open a pull request. GitHub Actions runs <code>lake build</code> — a green
              check means the proof is accepted.
            </span>
          </li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/submit" className="cta">
          Submit a Proof
        </Link>
        <Link href="/how-it-works" className="cta cta-outline">
          How It Works
        </Link>
      </div>
    </div>
  );
}
