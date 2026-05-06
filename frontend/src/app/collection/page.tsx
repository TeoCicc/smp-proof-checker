const EXAMPLE_PROOFS = [
  {
    name: 'add_zero',
    description: 'Adding zero on the right leaves a natural number unchanged.',
    file: 'ProofCollection/Basic.lean',
    code: `theorem add_zero (n : Nat) : n + 0 = n := rfl`,
  },
  {
    name: 'zero_add',
    description: 'Adding zero on the left leaves a natural number unchanged.',
    file: 'ProofCollection/Basic.lean',
    code: `theorem zero_add (n : Nat) : 0 + n = n := by omega`,
  },
  {
    name: 'add_self',
    description: 'A number added to itself equals twice that number.',
    file: 'ProofCollection/Basic.lean',
    code: `theorem add_self (n : Nat) : n + n = 2 * n := by omega`,
  },
  {
    name: 'add_comm_example',
    description: 'Natural number addition is commutative.',
    file: 'ProofCollection/Submissions/Example.lean',
    code: `theorem add_comm_example (a b : Nat) : a + b = b + a := by omega`,
  },
  {
    name: 'add_assoc_example',
    description: 'Natural number addition is associative.',
    file: 'ProofCollection/Submissions/Example.lean',
    code: `theorem add_assoc_example (a b c : Nat) : (a + b) + c = a + (b + c) := by omega`,
  },
];

export default function CollectionPage() {
  return (
    <div>
      <h1>Proof Collection</h1>
      <p>
        All proofs listed here have been verified by <code>lake build</code> and accepted
        into the collection via a passing GitHub Actions check.
      </p>

      <div className="note">
        <strong>MVP examples.</strong> These proofs are hardcoded for the demo. Once the
        submission pipeline is connected, this page will pull from the live repository.
      </div>

      {EXAMPLE_PROOFS.map((proof) => (
        <div key={proof.name} className="proof-card">
          <div className="proof-card-header">
            <span className="proof-name">{proof.name}</span>
            <span className="badge badge-blue">accepted</span>
          </div>
          <p className="proof-desc">{proof.description}</p>
          <pre className="preview" style={{ fontSize: '0.8rem', padding: '0.9rem 1.1rem' }}>
            {proof.code}
          </pre>
          <p className="proof-meta">
            Source: <code>{proof.file}</code>
          </p>
        </div>
      ))}
    </div>
  );
}
