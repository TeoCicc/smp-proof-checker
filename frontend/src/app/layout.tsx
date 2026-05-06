import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMP Proof Checker",
  description: "Submit and check Lean 4 math proofs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
