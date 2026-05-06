import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMP Proof Checker',
  description: 'Submit and check Lean 4 math proofs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="container main">{children}</div>
      </body>
    </html>
  );
}
