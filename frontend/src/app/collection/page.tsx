export default function CollectionPage() {
  return (
    <div>
      <h1>Proof Collection</h1>
      <p>
        Browse all accepted Lean&nbsp;4 proof submissions. Each entry has been verified by
        Lake and added to <code>ProofCollection/Submissions/</code>.
      </p>

      <div className="card">
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}
        >
          <h2 style={{ marginBottom: 0 }}>Coming soon</h2>
          <span className="badge badge-blue">Placeholder</span>
        </div>
        <p className="placeholder-text">
          This page will list all proofs in the collection once the submission pipeline is
          connected. For now, proofs live in{' '}
          <code>lean/ProofCollection/Submissions/Example.lean</code>.
        </p>
      </div>
    </div>
  );
}
