import Nav from './components/Nav';

const MARQUEE_ITEMS = [
  'Event Creation', 'QR Check-in', 'Custom Forms', 'Razorpay Payments',
  'Waitlisting', 'Live Analytics', 'Email Confirmations', 'MIT Licensed',
  'Self-Hostable', 'Open Source',
];

const FEATURES = [
  { num: '01', tag: 'Core',      name: 'Event Pages & Custom URLs' },
  { num: '02', tag: 'Ticketing', name: 'Free & Paid Tickets, Waitlisting' },
  { num: '03', tag: 'Check-in',  name: 'QR Scanner, Mobile-first' },
  { num: '04', tag: 'Forms',     name: 'Custom Registration Fields' },
  { num: '05', tag: 'Payments',  name: 'Razorpay, Zero Platform Fee' },
  { num: '06', tag: 'Analytics', name: 'Live Stats & CSV Export' },
];

const COMPARISON_ROWS = [
  { label: 'Platform fee',                  bad: 'Up to 5% per ticket', good: '0% — always' },
  { label: 'Gateway fee',                   bad: 'Extra 2–3%',          good: 'Pass-through only' },
  { label: 'Source code',                   bad: 'Closed source',       good: 'MIT licensed' },
  { label: 'Self-hosting',                  bad: 'Not possible',        good: 'Full support' },
  { label: 'Cost — 2000 attendees @ ₹500', bad: '₹70,000+ gone',       good: '₹0' },
];

export default function Home() {
  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="hero">
        <div className="hbg" />
        <div className="hgrain" />
        <div className="horbs">
          <div className="orb o1" />
          <div className="orb o2" />
          <div className="orb o3" />
        </div>
        <div className="hfig">
          <div className="hfig-letter">GP</div>
        </div>
        <div className="hscroll">
          <div className="sl" />
          <span className="st">Scroll to explore</span>
        </div>
        <div className="hcon">
          <p className="hbrow">The free, open-source event platform</p>
          <h1 className="htitle">
            THE<br />FREE<br /><span className="ot">PLATFORM.</span>
          </h1>
          <a href="/signup" className="hero-cta">Create your event →</a>
          <div className="hsvcs">
            <div className="hsvc"><span className="num">#01</span><span className="lbl">Event Creation</span></div>
            <div className="hsvc"><span className="num">#02</span><span className="lbl">QR Check-in</span></div>
            <div className="hsvc"><span className="num">#03</span><span className="lbl">Smart Ticketing</span></div>
            <div className="hsvc"><span className="num">#04</span><span className="lbl">Real-time Analytics</span></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mqw">
        <div className="mqt">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={`${item}-${i}`} className="mqi">
              <div className="mqd" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <section className="about">
        <div>
          <div className="albl">Behind Gatepass</div>
          <h2 className="ahead">EVENTS THAT KEEP YOUR MONEY WHERE IT BELONGS.</h2>
        </div>
        <div className="aright">
          <p className="adesc">
            Other platforms charge up to 7% per ticket. We charge zero — and we always will.
          </p>
          <p className="asub">
            Built for Indian college organisers who deserve great tools without the platform tax.
            MIT licensed, self-hostable, and production-grade out of the box.
          </p>
          <a href="/signup" className="acta">
            <span>Create your first event</span>
            <div className="arr">→</div>
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="work" id="features">
        <div className="sechdr">
          <h2 className="sectitle">FEATURES</h2>
          <a href="#" className="seclink">View all docs →</a>
        </div>
        <div className="wgrid">
          {FEATURES.map((f) => (
            <div key={f.num} className="wcard">
              <div className="wcph">{f.num}</div>
              <div className="wcmeta">
                <span className="wtag">{f.tag}</span>
                <p className="wname">{f.name}</p>
              </div>
              <div className="warr">↗</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stat">
          <span className="snum"><em>0</em>%</span>
          <span className="slbl">Platform fee. Forever.</span>
        </div>
        <div className="stat">
          <span className="snum">∞</span>
          <span className="slbl">Registrations on free tier</span>
        </div>
        <div className="stat">
          <span className="snum">MIT</span>
          <span className="slbl">License. Fork it. Own it.</span>
        </div>
        <div className="stat">
          <span className="snum"><em>5</em>min</span>
          <span className="slbl">Signup to live event</span>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="comparison" id="comparison">
        <h2 className="comp-head">
          WHY NOT<br /><em>OTHER</em><br />PLATFORMS?
        </h2>
        <table className="ctable">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Feature</th>
              <th style={{ width: '30%' }}>Other platforms</th>
              <th className="highlight" style={{ width: '30%' }}>Gatepass</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label}>
                <td className="label">{row.label}</td>
                <td><span className="badge-bad">{row.bad}</span></td>
                <td><span className="badge-good">{row.good}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* CTA */}
      <section className="contact">
        <div>
          <div className="clbl">Ready to ship?</div>
          <h2 className="chead">YOUR FEST.<br />YOUR MONEY.</h2>
        </div>
        <div className="cright">
          <p className="csub">
            No platform fee. No credit card. No catch. Gatepass is free forever and open source
            — so you own it completely.
          </p>
          <p className="cnote">Deploy on Vercel + Supabase in under 5 minutes.</p>
          <div className="cbtn-wrap">
            <a href="/signup" className="cbtn">Create your first event →</a>
            <a href="#" className="cbtn-ghost">⭐ Star on GitHub</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="flogo">GATE<span>PASS</span></div>
        <span className="fcopy">© 2026 Gatepass. MIT Licensed. Built for India.</span>
        <div className="flinks">
          <a href="#">GitHub</a>
          <a href="#">Docs</a>
          <a href="#">Contributing</a>
          <a href="#">License</a>
        </div>
      </footer>
    </>
  );
}
