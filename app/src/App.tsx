import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './pages/Login'
import { Join } from './pages/Join'
import { Campaigns } from './pages/Campaigns'
import { Overview } from './pages/Overview'
import { Members } from './pages/Members'
import { Shell, type Route } from './components/Shell'
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
  if (!session) return <main className="auth"><Login /></main>

  const [, route, param] = hash.split('/')
  const nome = (session.user.user_metadata?.name as string) || session.user.email || 'Giocatore'
  let attiva: Route = 'home'
  let pagina: React.ReactNode
  if (route === 'tavolo') {
    attiva = 'tavolo'
    pagina = <Table key={param} campaignId={param} userId={session.user.id} />
  } else if (route === 'membri') {
    attiva = 'membri'
    pagina = <Members key={param} campaignId={param} userId={session.user.id} />
  } else if (route === 'campagne') {
    attiva = 'campagne'
    pagina = <Campaigns userId={session.user.id} />
  } else if (route === 'invito') {
    pagina = <Join token={param} />
  } else {
    pagina = <Overview userId={session.user.id} />
  }
  return <Shell route={attiva} nome={nome} corrente={attiva === 'tavolo' || attiva === 'membri' ? param : undefined}>{pagina}</Shell>
}
