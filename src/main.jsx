import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const Brand = () => <div className="brand">Nailed <i>It!</i></div>

function Auth({ initialMode = 'signup', onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    if (!supabase) {
      setMessage('The account screens are ready. Connect Supabase to begin inviting the first circle.')
      setBusy(false)
      return
    }
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { display_name: form.name, username: form.username } } })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setMessage(result.error ? result.error.message : mode === 'signup' ? 'Check your email to finish joining.' : 'Welcome back!')
    setBusy(false)
  }

  return <div className="auth-view">
    <button className="back" onClick={onBack} aria-label="Back">←</button>
    <div className="auth-image"><img src="/images/friends-fresh-sets.png" alt="Friends showing four fresh nail sets" /></div>
    <div className="auth-panel">
      <Brand />
      <p className="kicker">YOUR NAILS. YOUR PEOPLE.</p>
      <h1>{mode === 'signup' ? <>Join your<br/><i>circle.</i></> : <>Good to see<br/><i>you again.</i></>}</h1>
      <form onSubmit={submit}>
        {mode === 'signup' && <>
          <label>NAME<input required name="name" autoComplete="name" value={form.name} onChange={update} placeholder="Your name" /></label>
          <label>USERNAME<div className="username"><span>@</span><input required name="username" autoComplete="username" value={form.username} onChange={update} placeholder="freshset" /></div></label>
        </>}
        <label>EMAIL<input required type="email" name="email" autoComplete="email" value={form.email} onChange={update} placeholder="you@example.com" /></label>
        <label>PASSWORD<input required minLength="8" type="password" name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={update} placeholder="At least 8 characters" /></label>
        <button className="primary" disabled={busy}>{busy ? 'ONE SEC…' : mode === 'signup' ? 'CREATE ACCOUNT  →' : 'SIGN IN  →'}</button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="switch">{mode === 'signup' ? 'Already have an account?' : 'New to Nailed It?'} <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage('') }}>{mode === 'signup' ? 'Sign in' : 'Create account'}</button></p>
      <p className="terms">By continuing, you agree to keep the circle kind.</p>
    </div>
  </div>
}

function Welcome({ onStart, onLogin }) {
  return <div className="welcome">
    <div className="desktop-photo left-photo"><img src="/images/friends-fresh-sets.png" alt="" /></div>
    <main className="phone-stage">
      <header><Brand /><button onClick={onLogin}>SIGN IN</button></header>
      <section className="hero-photo">
        <img src="/images/friends-fresh-sets.png" alt="Four friends showing their fresh nail art" />
        <div className="photo-tag">@THEPOLISHCIRCLE · JUST NOW</div>
      </section>
      <section className="intro">
        <p className="kicker">A PRIVATE NAIL SOCIAL</p>
        <h1>Your fresh set<br/>deserves its <i>moment.</i></h1>
        <p className="body-copy">Post the color. Tag your artist. Save the inspiration. Hype the friends who always understand the assignment.</p>
        <button className="primary" onClick={onStart}>JOIN THE FIRST CIRCLE <span>→</span></button>
        <button className="plain" onClick={onLogin}>I ALREADY HAVE AN ACCOUNT</button>
      </section>
      <section className="preview">
        <div className="preview-head"><b>WHAT'S HAPPENING</b><span>PRIVATE BY DEFAULT</span></div>
        <article>
          <div className="avatar">M</div><div><b>Maya</b><small>@mayamani · 12m</small></div><span className="dots">•••</span>
          <img src="/images/friends-fresh-sets.png" alt="Pink and black nail inspiration" />
          <div className="reactions"><span>♥ 24</span><span>◯ 8</span><span>♡ SAVE</span></div>
          <p><b>Maya</b> Everyone picked a different vibe and somehow it works 💅</p>
        </article>
      </section>
      <footer><Brand /><p>THE GROUP CHAT, BUT FOR THE SET.</p></footer>
    </main>
    <div className="desktop-photo right-photo"><img src="/images/friends-fresh-sets.png" alt="" /></div>
  </div>
}

function App() {
  const [view, setView] = useState('welcome')
  if (view !== 'welcome') return <div className="app-shell"><Auth initialMode={view} onBack={() => setView('welcome')} /></div>
  return <Welcome onStart={() => setView('signup')} onLogin={() => setView('login')} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
