import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const Sparkle = ({ className = '' }) => (
  <svg className={`sparkle ${className}`} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 0c1.8 12.8 7.2 18.2 20 20-12.8 1.8-18.2 7.2-20 20C18.2 27.2 12.8 21.8 0 20 12.8 18.2 18.2 12.8 20 0Z" />
  </svg>
)

const Nail = ({ color, accent, rotate = 0, height = 150 }) => (
  <div className="finger" style={{ transform: `rotate(${rotate}deg)` }}>
    <div className="nail" style={{ '--nail': color, '--accent': accent, height }}>
      <span className="nail-shine" />
    </div>
  </div>
)

function App() {
  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Nailed It home">
          <span>Nailed</span><em>It!</em>
        </a>
        <a className="nav-cta" href="#early-access">Get early access <span>↗</span></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>✦</span> YOUR NAILS. YOUR PEOPLE.</p>
          <h1>Fresh set?<br /><i>Say less.</i></h1>
          <p className="lede">The private social space for sharing every color, chrome, charm, and tiny masterpiece with the friends who get it.</p>
          <div className="hero-actions">
            <a className="button primary" href="#early-access">Join the first circle <span>→</span></a>
            <a className="text-link" href="#how">See how it works <span>↓</span></a>
          </div>
          <div className="social-proof">
            <div className="avatars" aria-hidden="true">
              <span>J</span><span>M</span><span>K</span><span>+</span>
            </div>
            <p>Made for the group chat<br /><strong>that always asks to see the set.</strong></p>
          </div>
        </div>

        <div className="hero-art" aria-label="An illustrated hand showing a colorful manicure">
          <div className="blob blob-one" />
          <div className="blob blob-two" />
          <Sparkle className="spark-one" />
          <Sparkle className="spark-two" />
          <div className="comment comment-one"><span>obsessed</span> 😍</div>
          <div className="comment comment-two">That chrome!! <span>♥</span></div>
          <div className="hand">
            <Nail color="#ff4f87" accent="#ffd4df" rotate={-10} height={136} />
            <Nail color="#8d65dc" accent="#f7b6ff" rotate={-3} height={160} />
            <Nail color="#f2b84b" accent="#fff4bd" rotate={3} height={170} />
            <Nail color="#74c6b2" accent="#d5fff3" rotate={9} height={148} />
          </div>
          <div className="polish">
            <div className="polish-cap" /><div className="polish-bottle"><span>NAILED<br />IT</span></div>
          </div>
        </div>
      </section>

      <section className="ticker" aria-label="Nail styles">
        <div>FRESH SETS <b>✦</b> REAL FRIENDS <b>✦</b> TINY ART <b>✦</b> BIG ENERGY <b>✦</b> FRESH SETS <b>✦</b> REAL FRIENDS</div>
      </section>

      <section className="how shell" id="how">
        <p className="eyebrow"><span>✦</span> IT'S YOUR CIRCLE</p>
        <div className="section-heading">
          <h2>Less feed.<br /><i>More feeling.</i></h2>
          <p>No chasing followers. No algorithm deciding who sees your post. Just a small, joyful place for the people whose opinions you actually want.</p>
        </div>
        <div className="feature-grid">
          <article><b>01</b><span className="feature-icon coral">⌁</span><h3>Post the set</h3><p>Snap a photo, tag the color or artist, and give your new nails their moment.</p></article>
          <article><b>02</b><span className="feature-icon violet">☺</span><h3>Share your circle</h3><p>Keep it close. Invite friends into private groups made for swapping inspiration.</p></article>
          <article><b>03</b><span className="feature-icon yellow">♡</span><h3>Hype each other</h3><p>Comment, react, save ideas—and always know who understood the assignment.</p></article>
        </div>
      </section>

      <section className="invite shell" id="early-access">
        <Sparkle className="invite-spark" />
        <p className="eyebrow">COMING TO A GROUP CHAT NEAR YOU</p>
        <h2>We’re starting small.<br /><i>You could be first.</i></h2>
        <p>Nailed It is being shaped with one real circle of friends before we open the doors wider.</p>
        <a className="button dark" href="mailto:hello@nailedit.social?subject=Nailed%20It%20early%20access">Tell me when it’s ready <span>→</span></a>
      </section>

      <footer className="shell">
        <a className="brand" href="#top"><span>Nailed</span><em>It!</em></a>
        <p>Made with good taste and fresh polish.</p>
        <p>© 2026 Nailed It</p>
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
