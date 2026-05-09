import ProofCollection.Basic

namespace ProofCollection.Submissions

theorem seed_add_rearrange (a b c : Nat) : (a + b) + c = c + (b + a) := by
  calc
    (a + b) + c = c + (a + b) := by
      rw [Nat.add_comm]
    _ = c + (b + a) := by
      rw [Nat.add_comm a b]

end ProofCollection.Submissions
