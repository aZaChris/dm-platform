import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './pages/Login'
import { Join } from './pages/Join'
import { Campaigns } from './pages/Campaigns'

// ponytail: routing a hash scritto a mano; se le schermate crescono, passare a react-router.
function useHash() {
  const [hash, setHash] = useState(location.hash || '#/')
  useEffect(() => {
    const on = () => setHash(location.hash || '#/')
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash
}

export function App() {
  const hash = useHash()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p>Caricamento…</p>
  if (!session) return <Login />

  const [, route, param] = hash.split('/')
  if (route === 'invito') return <Join token={param} />
  if (route === 'tavolo') return <p>Tavolo {param} (da implementare)</p>
  return <Campaigns userId={session.user.id} />
}
