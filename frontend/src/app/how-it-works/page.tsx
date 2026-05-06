import Link from 'next/link';

const STEPS = [
  {
    title: 'User writes a Lean proof',
    body: (
      <>
        The user goes to the Submit Proof page and enters a theorem name, an optional
        description, and their Lean&nbsp;4 proof code.
      </>
    ),
  },
  {
    title: 'App generates the Lean file',
    body: (
      <>
        The frontend wraps the proof in the correct namespace (
        <code>ProofCollection.Submissions</code>) and imports, producing a complete{' '}
        <code>.lean</code> file ready to drop into the repo.
      </>
    ),
  },
  {
    title: 'File is added to the repo',
    body: (
      <>
        The generated file is placed at{' '}
        <code>lean/ProofCollection/Submissions/&lt;Name&gt;.lean</code>. The import line
        is added to <code>lean/ProofCollection.lean</code> so Lake knows about it.
      </>
    ),
  },
  {
    title: 'ProofCollection.lean imports it',
    body: (
      <>
        Adding <code>import ProofCollection.Submissions.&lt;Name&gt;</code> to the root
        module means the new proof is part of the build. Lake compiles every imported
        module when you run <code>lake build</code>.
      </>
    ),
  },
  {
    title: 'GitHub Actions runs lake build',
    body: (
      <>
        When a pull request is opened, the <code>check-lean</code> CI job runs{' '}
        <code>lake build</code> inside <code>lean/</code>. Lean type-checks every theorem
        — any error fails the job.
      </>
    ),
  },
  {
    title: 'Branch protection accepts or rejects',
    body: (
      <>
        Branch protection on <code>main</code> requires <code>check-lean</code> to pass
        before a PR can be merged. An invalid proof is automatically blocked. A valid
        proof gets a green check and can be merged into the collection.
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <h1>How It Works</h1>
      <p>
        The full pipeline from proof submission to acceptance, step by step.
      </p>

      <div className="card">
        <ol className="pipeline">
          {STEPS.map((step, i) => (
            <li key={i} className="pipeline-step">
              <span className="pipeline-num">{i + 1}</span>
              <div className="pipeline-content">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="note">
        <strong>Coming next:</strong> automatic pull request creation through the GitHub
        API — no manual file copying needed.
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/submit" className="cta">
          Submit a Proof
        </Link>
        <Link href="/collection" className="cta cta-outline">
          View Collection
        </Link>
      </div>
    </div>
  );
}
