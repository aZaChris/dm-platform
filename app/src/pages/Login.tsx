import { useState } from 'react'
import { linkScaduto, supabase } from '../lib/supabase'
import { Embers } from '../components/Embers'

type Modo = 'accedi' | 'registrati' | 'dimenticata' | 'nuova'
const TITOLI: Record<Modo, [string, string, string]> = {
  accedi: ['Bentornato', 'Accedi', 'Entra'],
  registrati: ['Primo ingresso', 'Registrati', 'Crea account'],
  dimenticata: ['Nessun problema', 'Recupera la password', 'Mandami il link'],
  nuova: ['Ci sei quasi', 'Nuova password', 'Salva password'],
}

export function Login({ nuovaPassword, onFatto }: { nuovaPassword?: boolean; onFatto?: () => void }) {
  const [modo, setModo] = useState<Modo>(nuovaPassword ? 'nuova' : linkScaduto ? 'dimenticata' : 'accedi')
  const [avviso, setAvviso] = useState(!nuovaPassword && linkScaduto ? 'Il link non vale più: chiedine un altro.' : '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')

  async function invia(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    setAvviso('')
    const { error } =
      modo === 'registrati' ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : modo === 'dimenticata' ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/` })
      : modo === 'nuova' ? await supabase.auth.updateUser({ password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) return setErrore(error.message)
    // Stesso messaggio che l'account esista o no.
    if (modo === 'dimenticata') setAvviso("Se c'è un account con questa email, riceverai un link per scegliere una nuova password.")
    if (modo === 'nuova') onFatto?.()
  }

  const cambia = (m: Modo) => {
    setModo(m)
    setErrore('')
    setAvviso('')
    setPassword('')
  }
  const [occhiello, titolo, azione] = TITOLI[modo]

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
          <p className="eyebrow">{occhiello}</p>
          <h1>{titolo}</h1>
          <form onSubmit={invia}>
            {modo === 'registrati' && (
              <input name="name" autoComplete="nickname" placeholder="Nome visibile…" aria-label="Nome visibile" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            {modo !== 'nuova' && (
              <input type="email" name="email" autoComplete="email" spellCheck={false} placeholder="tu@esempio.it" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            )}
            {modo !== 'dimenticata' && (
              <input
                type="password"
                name="password"
                autoComplete={modo === 'accedi' ? 'current-password' : 'new-password'}
                aria-label={modo === 'nuova' ? 'Nuova password' : 'Password'}
                placeholder="Password (min. 6 caratteri)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            )}
            <button>{azione}</button>
            {avviso && <p role="status">{avviso}</p>}
            {errore && <p className="error" role="alert">{errore}</p>}
          </form>
          {modo === 'accedi' && <button className="link-btn" onClick={() => cambia('dimenticata')}>Password dimenticata?</button>}
          {modo !== 'nuova' && (
            <button className="link-btn" onClick={() => cambia(modo === 'accedi' ? 'registrati' : 'accedi')}>
              {modo === 'accedi' ? 'Non ho un account' : modo === 'registrati' ? 'Ho già un account' : "Torna all'accesso"}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
