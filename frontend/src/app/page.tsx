import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>SMP Proof Checker</h1>
      <p>
        A tool for submitting and verifying Lean&nbsp;4 math proofs. Valid submissions are
        reviewed and added to the proof collection.
      </p>

      <div className="card">
        <h2>How it works</h2>
        <ul className="step-list">
          <li>
            <span className="step-num">1</span>
            <span>
              <strong>Write your proof</strong> — use the Submit Proof page to enter your
              theorem name and Lean&nbsp;4 code.
            </span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>
              <strong>Generate the file</strong> — the form wraps your code in the correct
              namespace and imports so it fits into the collection.
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>
              <strong>Lake checks it</strong> — Lean&nbsp;4 and Lake are the actual proof
              checkers. If your code compiles, the proof is valid.
            </span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span>
              <strong>Join the collection</strong> — accepted proofs are added to{' '}
              <code>ProofCollection/Submissions/</code> and are visible to everyone.
            </span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>About the checker</h2>
        <p>
          Lean&nbsp;4 is a functional programming language and interactive theorem prover.
          Lake is its build system. Together they provide a rigorous, machine-verified
          foundation for checking mathematical proofs — no hand-waving, no partial credit.
        </p>
        <p style={{ marginBottom: 0 }}>
          This project is part of a school assignment exploring proof verification
          pipelines. The frontend helps format submissions; the real verification happens
          inside the <code>lean/</code> directory.
        </p>
      </div>

      <Link href="/submit" className="cta">
        Submit a Proof →
      </Link>
    </div>
  );
}
