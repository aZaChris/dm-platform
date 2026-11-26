import { supabase } from '../lib/supabase'
import { Icon } from './Icon'

export type Route = 'home' | 'campagne' | 'tavolo' | 'schede' | 'membri'
const TITOLI: Record<Route, string> = { home: 'Panoramica', campagne: 'Campagne', tavolo: 'Tavolo di gioco', schede: 'Schede', membri: 'Membri' }

export const ULTIMA = 'dm.ultimaCampagna'
export const ultimaCampagna = () => {
  try {
    return localStorage.getItem(ULTIMA)
  } catch {
    return null // storage bloccato: la voce "Tavolo" resta spenta
  }
}

type Props = { route: Route; nome: string; corrente?: string; children: React.ReactNode }

// Guscio dell'app: barra laterale + briciole di pane + contenuto.
export function Shell({ route, nome, corrente, children }: Props) {
  const ultima = corrente ?? ultimaCampagna() // nel tavolo vale quella del percorso, prima che venga salvata
  const voci: { r: Route; href: string | null; icona: 'grid' | 'scroll' | 'map' | 'sheet' | 'users'; testo: string }[] = [
    { r: 'home', href: '#/', icona: 'grid', testo: 'Panoramica' },
    { r: 'campagne', href: '#/campagne', icona: 'scroll', testo: 'Campagne' },
    { r: 'tavolo', href: ultima ? `#/tavolo/${ultima}` : null, icona: 'map', testo: 'Tavolo di gioco' },
    { r: 'schede', href: ultima ? `#/schede/${ultima}` : null, icona: 'sheet', testo: 'Schede' },
    { r: 'membri', href: ultima ? `#/membri/${ultima}` : null, icona: 'users', testo: 'Membri' },
  ]

  return (
    <div className="shell">
      <a className="skip" href="#contenuto" onClick={(e) => { e.preventDefault(); document.getElementById('contenuto')?.focus() }}>Vai al contenuto</a>
      <aside className="side">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">✦</span> <span translate="no">DM Platform</span>
        </a>
        <p className="eyebrow side-label">Il tuo spazio</p>
        <nav aria-label="Principale">
          {voci.map((v) =>
            v.href ? (
              <a key={v.r} href={v.href} className={`nav ${route === v.r ? 'on' : ''}`} aria-current={route === v.r ? 'page' : undefined}>
                <Icon name={v.icona} /> {v.testo}
              </a>
            ) : (
              <span key={v.r} className="nav off" title="Apri prima un tavolo">
                <Icon name={v.icona} /> {v.testo}
              </span>
            ),
          )}
        </nav>
        <div className="side-user">
          <span className="avatar" aria-hidden="true">{nome.slice(0, 2).toUpperCase()}</span>
          <span className="side-user-name">{nome}</span>
          <button className="icon-btn" onClick={() => supabase.auth.signOut()} aria-label="Esci" title="Esci">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <main className="main" id="contenuto" tabIndex={-1}>
        <p className="crumbs">
          <span>DM Platform</span> <span aria-hidden="true">/</span> <b>{TITOLI[route]}</b>
        </p>
        {children}
      </main>
    </div>
  )
}
