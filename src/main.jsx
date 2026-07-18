import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const Brand = () => <div className="brand">Nailed <i>It!</i></div>

function Auth({ initialMode = 'signup', onBack, onAuthenticated }) {
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
    setMessage(result.error ? result.error.message : mode === 'signup' && !result.data.session ? 'Check your email to finish joining.' : 'Welcome to your circle!')
    if (result.data?.session) onAuthenticated(result.data.session)
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

function Feed({ session, onSignOut }) {
  const [tab, setTab] = useState('home')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [openComments, setOpenComments] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState('')
  const [status, setStatus] = useState('')
  const [posting, setPosting] = useState(false)

  const loadPosts = async () => {
    setLoading(true)
    const result = await supabase.from('posts').select('id,user_id,image_path,caption,created_at,profiles:profiles!posts_user_id_fkey(display_name,username,avatar_path,bio),likes(user_id),comments(id,user_id,body,created_at,profiles:profiles!comments_user_id_fkey(display_name,username))').order('created_at', { ascending: false })
    if (result.error) { setStatus(result.error.message); setLoading(false); return }
    const hydrated = await Promise.all(result.data.map(async post => {
      const signed = await supabase.storage.from('nail-posts').createSignedUrl(post.image_path, 3600)
      let avatarUrl = ''
      if (post.profiles?.avatar_path) {
        const avatar = await supabase.storage.from('avatars').createSignedUrl(post.profiles.avatar_path, 3600)
        avatarUrl = avatar.data?.signedUrl || ''
      }
      return { ...post, imageUrl: signed.data?.signedUrl || '', avatarUrl }
    }))
    setPosts(hydrated)
    setLoading(false)
  }

  const loadProfile = async () => {
    const result = await supabase.from('profiles').select('display_name,username,bio,avatar_path').eq('id', session.user.id).single()
    if (result.error) return setStatus(result.error.message)
    let avatarUrl = ''
    if (result.data.avatar_path) {
      const signed = await supabase.storage.from('avatars').createSignedUrl(result.data.avatar_path, 3600)
      avatarUrl = signed.data?.signedUrl || ''
    }
    setProfile({ ...result.data, avatarUrl })
    setBio(result.data.bio || '')
    setAvatarPreview(avatarUrl)
  }

  useEffect(() => { loadPosts(); loadProfile() }, [])

  const toggleLike = async post => {
    const liked = post.likes?.some(like => like.user_id === session.user.id)
    const result = liked
      ? await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id)
      : await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id })
    if (result.error) return setStatus(result.error.message)
    await loadPosts()
  }

  const addComment = async postId => {
    const body = commentDraft.trim()
    if (!body) return
    const result = await supabase.from('comments').insert({ post_id: postId, user_id: session.user.id, body })
    if (result.error) return setStatus(result.error.message)
    setCommentDraft('')
    await loadPosts()
  }

  const updateProfile = async avatarFile => {
    setProfileBusy(true)
    setStatus('')
    let avatarPath = profile?.avatar_path || null
    if (avatarFile) {
      if (avatarFile.size > 5 * 1024 * 1024) { setStatus('Choose a profile image smaller than 5 MB.'); setProfileBusy(false); return }
      const extension = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      avatarPath = `${session.user.id}/avatar.${extension}`
      const upload = await supabase.storage.from('avatars').upload(avatarPath, avatarFile, { contentType: avatarFile.type, upsert: true })
      if (upload.error) { setStatus(upload.error.message); setProfileBusy(false); return }
    }
    const result = await supabase.from('profiles').update({ bio: bio.trim() || null, avatar_path: avatarPath, updated_at: new Date().toISOString() }).eq('id', session.user.id)
    if (result.error) setStatus(result.error.message)
    else { setStatus('Profile updated.'); await loadProfile(); await loadPosts() }
    setProfileBusy(false)
  }

  const choose = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (selected.size > 10 * 1024 * 1024) return setStatus('Choose an image smaller than 10 MB.')
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setStatus('')
  }
  const publish = async () => {
    if (!file || !supabase) return
    setPosting(true)
    setStatus('')
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`
    const upload = await supabase.storage.from('nail-posts').upload(path, file, { contentType: file.type, upsert: false })
    if (upload.error) { setStatus(upload.error.message); setPosting(false); return }
    const post = await supabase.from('posts').insert({ user_id: session.user.id, image_path: path, caption: caption.trim() || null })
    if (post.error) { await supabase.storage.from('nail-posts').remove([path]); setStatus(post.error.message); setPosting(false); return }
    setStatus('Your fresh set is in the circle!')
    setFile(null); setPreview(''); setCaption(''); setPosting(false)
    await loadPosts()
    setTab('home')
  }
  const visiblePosts = tab === 'profile' ? posts.filter(post => post.user_id === session.user.id) : posts
  return <main className="feed-view">
    <header><Brand /><button onClick={onSignOut}>SIGN OUT</button></header>
    {tab === 'add' ? <><section className="feed-title"><p className="kicker">NEW POST</p><h1>Show us the <i>set.</i></h1><p>Choose a photo from your camera or library. Only signed-in members can see it.</p></section>
    <section className="composer">
      <label className={`image-picker ${preview ? 'has-image' : ''}`}>
        {preview ? <img src={preview} alt="Your selected nail photo preview" /> : <><b>＋</b><span>ADD A NAIL PHOTO</span><small>Camera or photo library · up to 10 MB</small></>}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={choose} />
      </label>
      {file && <><textarea maxLength="500" value={caption} onChange={event => setCaption(event.target.value)} placeholder="Tell the circle about this set…" /><button className="primary" disabled={posting} onClick={publish}>{posting ? 'POSTING…' : 'POST TO MY CIRCLE'} <span>→</span></button></>}
      {status && <p className="form-message" role="status">{status}</p>}
    </section></> : <>
      {tab === 'profile' && <section className="profile-card">
        <label className="avatar-picker">
          {avatarPreview ? <img src={avatarPreview} alt="Your profile" /> : <span>{(profile?.display_name || 'N').slice(0,1).toUpperCase()}</span>}
          <b>＋</b><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={event => { const picked = event.target.files?.[0]; if (picked) { setAvatarPreview(URL.createObjectURL(picked)); updateProfile(picked) } }} />
        </label>
        <div className="profile-identity"><h2>{profile?.display_name || 'Nailed It member'}</h2><p>@{profile?.username || 'freshset'}</p></div>
        <textarea maxLength="160" value={bio} onChange={event => setBio(event.target.value)} placeholder="Add a short bio…" />
        <button className="profile-save" disabled={profileBusy} onClick={() => updateProfile()}>{profileBusy ? 'SAVING…' : 'SAVE PROFILE'}</button>
        {status && <p className="form-message" role="status">{status}</p>}
      </section>}
      <section className="stream-title"><div><p className="kicker">{tab === 'profile' ? 'YOUR PROFILE' : 'YOUR PRIVATE CIRCLE'}</p><h1>{tab === 'profile' ? 'My sets.' : 'Fresh sets.'}</h1></div><span>{visiblePosts.length} {visiblePosts.length === 1 ? 'POST' : 'POSTS'}</span></section>
      <section className="post-stream">
        {loading ? <p className="loading">Loading the circle…</p> : visiblePosts.length ? visiblePosts.map(post => <article className="feed-post" key={post.id}>
          <div className="post-author"><div className="avatar">{post.avatarUrl ? <img src={post.avatarUrl} alt="" /> : (post.profiles?.display_name || 'N').slice(0,1).toUpperCase()}</div><div><b>{post.profiles?.display_name || 'Nailed It member'}</b><small>@{post.profiles?.username || 'freshset'} · {new Date(post.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></div><span>•••</span></div>
          {post.imageUrl && <img src={post.imageUrl} alt={post.caption || 'A fresh nail set'} />}
          <div className="reactions"><button className={post.likes?.some(like => like.user_id === session.user.id) ? 'liked' : ''} onClick={() => toggleLike(post)}>{post.likes?.some(like => like.user_id === session.user.id) ? '♥' : '♡'} {post.likes?.length || 0}</button><button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}>◯ {post.comments?.length || 0}</button></div>
          {post.caption && <p className="caption"><b>{post.profiles?.display_name || 'Member'}</b> {post.caption}</p>}
          {openComments === post.id && <div className="comments">
            {post.comments?.map(comment => <p key={comment.id}><b>{comment.profiles?.display_name || 'Member'}</b> {comment.body}</p>)}
            {!post.comments?.length && <small>Be the first to say something.</small>}
            <div className="comment-form"><input maxLength="500" value={commentDraft} onChange={event => setCommentDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addComment(post.id) }} placeholder="Add a comment…" /><button onClick={() => addComment(post.id)}>POST</button></div>
          </div>}
        </article>) : <div className="first-post"><span>♡</span><b>{tab === 'profile' ? 'No sets posted yet.' : 'Your circle is waiting.'}</b><p>Tap the pink button below to share the first fresh set.</p></div>}
      </section>
    </>}
    <nav className="tab-bar" aria-label="App navigation">
      <button className={tab === 'home' ? 'active' : ''} onClick={() => { setTab('home'); setStatus('') }}><span>⌂</span>HOME</button>
      <button className="add-tab" onClick={() => { setTab('add'); setStatus('') }} aria-label="Create a post">＋</button>
      <button className={tab === 'profile' ? 'active' : ''} onClick={() => { setTab('profile'); setStatus('') }}><span>○</span>PROFILE</button>
    </nav>
  </main>
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
          <div className="reactions"><span>♥ 24</span><span>◯ 8</span></div>
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
  const [session, setSession] = useState(null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])
  if (session) return <div className="app-shell"><Feed session={session} onSignOut={async () => { await supabase.auth.signOut(); setView('welcome') }} /></div>
  if (view !== 'welcome') return <div className="app-shell"><Auth initialMode={view} onBack={() => setView('welcome')} onAuthenticated={setSession} /></div>
  return <Welcome onStart={() => setView('signup')} onLogin={() => setView('login')} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
