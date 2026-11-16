import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

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

function Segnaposto({ nome }: { nome: string }) {
  return <p>{nome} (da implementare)</p>
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
  if (!session) return <Segnaposto nome="Login" />

  const [, route, param] = hash.split('/')
  if (route === 'invito') return <Segnaposto nome={`Invito ${param}`} />
  if (route === 'tavolo') return <Segnaposto nome={`Tavolo ${param}`} />
  return <Segnaposto nome="Campagne" />
}
