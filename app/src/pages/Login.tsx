import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
      <h1>{registrati ? 'Registrati' : 'Accedi'}</h1>
      <form onSubmit={invia}>
        {registrati && (
          <input placeholder="Nome visibile" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Password (min. 6 caratteri)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button>{registrati ? 'Crea account' : 'Entra'}</button>
        {errore && <p className="error">{errore}</p>}
      </form>
      <p>
        <button onClick={() => setRegistrati(!registrati)}>
          {registrati ? 'Ho già un account' : 'Non ho un account'}
        </button>
      </p>
    </>
  )
}
