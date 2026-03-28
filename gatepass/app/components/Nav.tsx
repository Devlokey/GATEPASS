'use client';

import { useEffect, useState } from 'react';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [progWidth, setProgWidth] = useState(0);
  const [mobOpen, setMobOpen] = useState(false);

  // Sync body scroll lock with menu state — unmount cleanup included
  useEffect(() => {
    document.body.style.overflow = mobOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const total = document.body.scrollHeight - window.innerHeight;
      setProgWidth(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC key — uses setter directly, no stale closure
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const closeMob = () => setMobOpen(false);

  return (
    <>
      <div id="prog" style={{ width: `${progWidth}%` }} />

      {/* Backdrop — closes menu on outside click */}
      {mobOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 399 }}
          onClick={closeMob}
          aria-hidden="true"
        />
      )}

      <div
        className={`mob-menu${mobOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal={mobOpen}
        aria-label="Navigation menu"
      >
        <a href="#features" onClick={closeMob}>Features</a>
        <a href="#comparison" onClick={closeMob}>Pricing</a>
        <a href="#" onClick={closeMob}>GitHub</a>
        <a href="/signup" className="mob-cta" onClick={closeMob}>Get started →</a>
        <div className="mob-menu-foot">
          <a href="#">MIT License</a>
          <a href="#">Built for India</a>
        </div>
      </div>

      <nav className={scrolled ? 'scrolled' : ''}>
        <a href="/" className="nlogo">GATE<span>PASS</span></a>
        <div className="nlinks">
          <a href="#features">Features</a>
          <a href="#comparison">Pricing</a>
          <a href="#">GitHub</a>
          <a href="/signup" className="ncta">Get started</a>
        </div>
        <button
          className={`hamburger${mobOpen ? ' open' : ''}`}
          onClick={() => setMobOpen(prev => !prev)}
          aria-label={mobOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobOpen}
        >
          <span /><span /><span />
        </button>
      </nav>
    </>
  );
}
