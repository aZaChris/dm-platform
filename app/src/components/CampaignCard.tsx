import { Icon } from './Icon'
import type { Riga } from '../hooks/useCampaigns'

// Tonalità della copertina ricavata dal nome: ogni campagna ha sempre la stessa, senza salvarla da nessuna parte.
const tonalita = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

// Card di una campagna; i figli sono azioni extra (es. "Crea invito" per il DM). `i` scagliona l'entrata.
export function CampaignCard({ riga, i = 0, children }: { riga: Riga; i?: number; children?: React.ReactNode }) {
  const { role, campaigns: c } = riga
  return (
    <article className="card campaign" style={{ '--i': i, '--hue': tonalita(c.name) } as React.CSSProperties}>
      <div className="campaign-cover" aria-hidden="true">
        <span className="chip-icon"><Icon name={role === 'dm' ? 'crown' : 'moon'} size={20} /></span>
      </div>
      <div className="campaign-top">
        <h3 className="campaign-name">{c.name}</h3>
        <span className={`badge ${role === 'dm' ? 'dm' : ''}`}>{role === 'dm' ? 'DM' : 'Giocatore'}</span>
      </div>
      <p className="muted small">{c.campaign_members[0]?.count ?? 1} {c.campaign_members[0]?.count === 1 ? 'membro' : 'membri'}</p>
      <div className="campaign-foot">
        {children}
        <a className="arrow-link" href={`#/tavolo/${c.id}`}>Apri tavolo <span aria-hidden="true">→</span></a>
      </div>
    </article>
  )
}
