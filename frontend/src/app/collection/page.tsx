import { readProofIndex } from '@/lib/proofs';
import type { ProofEntry } from '@/lib/proofs';

export default function CollectionPage() {
  const proofs = readProofIndex();

  return (
    <div>
      <h1>Proof Collection</h1>
      <p>
        All proofs listed here have been verified by <code>lake build</code> and accepted
        into the collection via a passing GitHub Actions check.
      </p>

      {proofs.length === 0 ? (
        <div className="card">
          <p className="placeholder-text">
            No proofs in the collection yet. Be the first to{' '}
            <a href="/submit">submit one</a>.
          </p>
        </div>
      ) : (
        proofs.map((proof: ProofEntry) => (
          <div key={proof.theoremName} className="proof-card">
            <div className="proof-card-header">
              <span className="proof-name">{proof.theoremName}</span>
              <span className="badge badge-blue">accepted</span>
              {proof.submittedVia === 'automatic-pr' && (
                <span className="badge badge-green">auto-submitted</span>
              )}
            </div>
            <p className="proof-desc">{proof.description}</p>
            <pre className="preview" style={{ fontSize: '0.8rem', padding: '0.9rem 1.1rem' }}>
              {proof.leanCode}
            </pre>
            <p className="proof-meta">
              Source: <code>{proof.filePath}</code>
            </p>
          </div>
        ))
      )}
    </div>
  );
}
