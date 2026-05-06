'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/submit', label: 'Submit Proof' },
  { href: '/collection', label: 'Collection' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">
          SMP Proof Checker
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? 'nav-link active' : 'nav-link'}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
