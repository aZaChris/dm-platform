import { useTable } from '../hooks/useTable'
import { MapCanvas } from '../components/MapCanvas'
import { DmPanel } from '../components/DmPanel'

export function Table({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { role, mapUrl, mapPath, tokens, members, moveToken, errore } = useTable(campaignId, userId)

  if (role === undefined) return <p>Caricamento…</p>
  if (role === null) {
    return (
      <>
        <p className="error">Non fai parte di questa campagna.</p>
        <a href="#/">Torna alle campagne</a>
      </>
    )
  }

  return (
    <>
      <div className="row">
        <a href="#/">← Campagne</a> <span>({role === 'dm' ? 'DM' : 'Player'})</span>
      </div>
      {role === 'dm' && <DmPanel campaignId={campaignId} userId={userId} mapPath={mapPath} tokens={tokens} members={members} />}
      {errore && <p className="error">{errore}</p>}
      {mapUrl ? (
        <MapCanvas url={mapUrl} tokens={tokens} userId={userId} isDm={role === 'dm'} onMove={moveToken} />
      ) : (
        <p>Nessuna mappa{role === 'dm' ? ': caricane una.' : ' ancora.'}</p>
      )}
    </>
  )
}
