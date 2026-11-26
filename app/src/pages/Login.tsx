import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Embers } from '../components/Embers'

export function Login() {
  const [registrati, setRegistrati] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    const { error } = registrati
      ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrore(error.message)
  }

  return (
    <>
      <div className="auth-art">
        <Embers />
        <a className="brand" href="/presentazione/">
          <span className="brand-mark" aria-hidden="true">✦</span> <span translate="no">DM Platform</span>
        </a>
        <p className="auth-quote">Mappa, token e dadi condivisi: il tavolo è pronto prima che arrivi il party.</p>
      </div>
      <div className="auth-side">
        <div className="card auth-card">
          <p className="eyebrow">{registrati ? 'Primo ingresso' : 'Bentornato'}</p>
          <h1>{registrati ? 'Registrati' : 'Accedi'}</h1>
          <form onSubmit={invia}>
            {registrati && (
              <input name="name" autoComplete="nickname" placeholder="Nome visibile…" aria-label="Nome visibile" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input type="email" name="email" autoComplete="email" spellCheck={false} placeholder="tu@esempio.it" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input
              type="password"
              name="password"
              autoComplete={registrati ? 'new-password' : 'current-password'}
              aria-label="Password"
              placeholder="Password (min. 6 caratteri)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button>{registrati ? 'Crea account' : 'Entra'}</button>
            {errore && <p className="error" role="alert">{errore}</p>}
          </form>
          <button className="link-btn" onClick={() => setRegistrati(!registrati)}>
            {registrati ? 'Ho già un account' : 'Non ho un account'}
          </button>
        </div>
      </div>
    </>
  )
}
