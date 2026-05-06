-- Basic.lean: example theorems used to verify the Lake build works.

-- Commutativity of natural-number addition (proved by the omega tactic).
theorem add_comm_example (a b : Nat) : a + b = b + a := by
  omega

-- A trivial identity to show propositional equality.
theorem nat_eq_self (n : Nat) : n = n := rfl
