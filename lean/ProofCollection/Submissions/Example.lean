import ProofCollection.Basic

namespace ProofCollection.Submissions.Example

-- Example submission: addition is commutative
theorem add_comm_example (a b : Nat) : a + b = b + a := by omega

-- Example submission: addition is associative
theorem add_assoc_example (a b c : Nat) : (a + b) + c = a + (b + c) := by omega

-- Example submission: zero is the identity from both sides
theorem zero_add_example (n : Nat) : 0 + n = n := ProofCollection.Basic.zero_add n
theorem add_zero_example (n : Nat) : n + 0 = n := ProofCollection.Basic.add_zero n

end ProofCollection.Submissions.Example
