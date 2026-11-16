import { useState } from 'react'
import { supabase } from '../lib/supabase'

const TIPI = ['image/jpeg', 'image/png', 'image/webp']
const MAX = 5 * 1024 * 1024

export function DmPanel({ campaignId, mapPath }: { campaignId: string; mapPath: string | null }) {
  const [errore, setErrore] = useState('')
  const [carico, setCarico] = useState(false)

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

  return (
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
      {errore && <span className="error">{errore}</span>}
    </div>
  )
}
