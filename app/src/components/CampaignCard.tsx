import { Icon } from './Icon'
import type { Riga } from '../hooks/useCampaigns'

// Card di una campagna; i figli sono azioni extra (es. "Crea invito" per il DM).
export function CampaignCard({ riga, children }: { riga: Riga; children?: React.ReactNode }) {
  const { role, campaigns: c } = riga
  return (
    <article className="card campaign">
      <div className="campaign-top">
        <span className="chip-icon"><Icon name={role === 'dm' ? 'crown' : 'moon'} size={20} /></span>
        <span className={`badge ${role === 'dm' ? 'dm' : ''}`}>{role === 'dm' ? 'Dungeon Master' : 'Giocatore'}</span>
      </div>
      <h3 className="campaign-name">{c.name}</h3>
      <p className="muted small">{c.campaign_members[0]?.count ?? 1} {c.campaign_members[0]?.count === 1 ? 'membro' : 'membri'}</p>
      <div className="campaign-foot">
        {children}
        <a href={`#/tavolo/${c.id}`}>Apri tavolo →</a>
      </div>
    </article>
  )
}
