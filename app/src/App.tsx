import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './pages/Login'
import { Join } from './pages/Join'
import { Campaigns } from './pages/Campaigns'
import { Table } from './pages/Table'

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
  if (!session) return <main className="page"><Login /></main>

  const [, route, param] = hash.split('/')
  if (route === 'tavolo') return <Table campaignId={param} userId={session.user.id} />
  return (
    <main className="page">
      {route === 'invito' ? <Join token={param} /> : <Campaigns userId={session.user.id} />}
    </main>
  )
}
