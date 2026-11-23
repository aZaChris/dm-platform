import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Member, Token } from '../hooks/useTable'

const TIPI = ['image/jpeg', 'image/png', 'image/webp']
const MAX = 5 * 1024 * 1024

type Props = { campaignId: string; userId: string; mapPath: string | null; tokens: Token[]; members: Member[] }

export function DmPanel({ campaignId, userId, mapPath, tokens, members }: Props) {
  const [errore, setErrore] = useState('')
  const [carico, setCarico] = useState(false)
  const [nome, setNome] = useState('')
  const [colore, setColore] = useState('#c0392b')
  const [owner, setOwner] = useState('')

  async function caricaMappa(file: File) {
    setErrore('')
    if (!TIPI.includes(file.type)) return setErrore('Formato non supportato: usa JPG, PNG o WebP.')
    if (file.size > MAX) return setErrore('Immagine troppo grande: massimo 5 MB.')

    setCarico(true)
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const path = `${campaignId}/${crypto.randomUUID()}.${ext}`
    const su = await supabase.storage.from('maps').upload(path, file, { contentType: file.type })
    if (su.error) {
      setCarico(false)
      return setErrore(su.error.message)
    }
    const db = await supabase
      .from('maps')
      .upsert({ campaign_id: campaignId, image_path: path, updated_at: new Date().toISOString() })
    setCarico(false)
    if (db.error) return setErrore(db.error.message)
    if (mapPath) await supabase.storage.from('maps').remove([mapPath]) // ripulisce la vecchia, se fallisce pazienza
  }

  // Il token compare a tutti via Realtime; il DM lo trascina poi dove serve.
  async function creaToken(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    const { error } = await supabase
      .from('tokens')
      .insert({ campaign_id: campaignId, name: nome, color: colore, col: 0, row: 0, owner_id: owner || null })
    if (error) setErrore(error.message)
    else setNome('')
  }

  async function aggiorna(id: string, campi: Partial<Pick<Token, 'name' | 'owner_id'>>) {
    const { error } = await supabase.from('tokens').update(campi).eq('id', id)
    if (error) setErrore(error.message)
  }

  async function elimina(id: string) {
    const { error } = await supabase.from('tokens').delete().eq('id', id)
    if (error) setErrore(error.message)
  }

  // La RLS impedisce comunque al DM di rimuovere se stesso; qui nascondiamo il pulsante.
  async function rimuovi(m: Member) {
    if (!confirm(`Rimuovere ${m.display_name} dalla campagna?`)) return
    const { data, error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', m.user_id)
      .select('user_id')
    if (error) setErrore(error.message)
    else if (!data.length) setErrore('Non è stato possibile rimuovere il membro.')
  }

  const giocatori = members.filter((m) => m.role === 'player')

  return (
    <div>
      <div className="row">
        <label>
          {mapPath ? 'Sostituisci mappa' : 'Carica mappa'}:{' '}
          <input
            type="file"
            accept={TIPI.join(',')}
            disabled={carico}
            onChange={(e) => e.target.files?.[0] && caricaMappa(e.target.files[0])}
          />
        </label>
        {carico && <span>Caricamento…</span>}
      </div>

      <form className="row" onSubmit={creaToken} style={{ flexDirection: 'row', maxWidth: 'none' }}>
        <input placeholder="Nome token" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} required />
        <input type="color" value={colore} onChange={(e) => setColore(e.target.value)} />
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Mio (DM)</option>
          {giocatori.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.display_name}
            </option>
          ))}
        </select>
        <button>Crea token</button>
      </form>

      <h3>Membri</h3>
      {members.map((m) => (
        <div className="row" key={m.user_id}>
          <span>
            {m.display_name} ({m.role === 'dm' ? 'DM' : 'Player'})
          </span>
          {m.user_id !== userId && <button onClick={() => rimuovi(m)}>Rimuovi</button>}
        </div>
      ))}

      <h3>Token</h3>
      {tokens.map((t) => (
        <div className="row" key={t.id}>
          <span style={{ color: t.color }}>●</span>
          <input defaultValue={t.name} maxLength={40} onBlur={(e) => e.target.value && e.target.value !== t.name && aggiorna(t.id, { name: e.target.value })} />
          <select value={t.owner_id ?? ''} onChange={(e) => aggiorna(t.id, { owner_id: e.target.value || null })}>
            <option value="">Mio (DM)</option>
            {giocatori.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name}
              </option>
            ))}
          </select>
          <button onClick={() => elimina(t.id)}>Elimina</button>
        </div>
      ))}
      {errore && <p className="error">{errore}</p>}
    </div>
  )
}
