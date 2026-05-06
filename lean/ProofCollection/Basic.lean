namespace ProofCollection.Basic

-- n + 0 = n
-- Definitionally true: Nat.add recurses on the right argument,
-- so `n + 0` reduces to `n` by definition.
theorem add_zero (n : Nat) : n + 0 = n := rfl

-- 0 + n = n
-- Not definitional (requires induction); omega closes it in one step.
theorem zero_add (n : Nat) : 0 + n = n := by omega

-- n + n = 2 * n
theorem add_self (n : Nat) : n + n = 2 * n := by omega

-- Successor is strictly greater than n
theorem lt_succ (n : Nat) : n < n + 1 := by omega

end ProofCollection.Basic
