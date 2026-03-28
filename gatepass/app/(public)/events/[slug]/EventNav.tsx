'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EventNavProps {
  slug: string;
  title: string;
}

export default function EventNav({ slug, title }: EventNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleShare() {
    if (navigator.share) {
      try {
        navigator.share({
          title,
          text: `Register for ${title}`,
          url: window.location.href,
        });
      } catch {
        // share dismissed or failed — ignore
      }
    } else {
      try {
        navigator.clipboard.writeText(window.location.href);
      } catch {
        // clipboard write failed — ignore
      }
    }
  }

  return (
    <nav className={`ev-nav${scrolled ? ' ev-nav--scrolled' : ''}`}>
      <Link href="/" className="ev-nlogo">
        GATE<span>PASS</span>
      </Link>
      <div className="ev-nav-r">
        <button className="ev-nav-share" onClick={handleShare} type="button" aria-label="Share event">
          ↗ Share
        </button>
        <Link href={`/events/${slug}/register`} className="ev-nav-reg">
          Register Now
        </Link>
      </div>
    </nav>
  );
}
