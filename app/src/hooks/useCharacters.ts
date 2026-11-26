import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withDefaults, type CharacterData } from '../lib/character'

export type Scheda = {
  id: string
  campaign_id: string
  owner_id: string | null
  token_id: string | null
  name: string
  data: CharacterData
  updated_at: string
}

const COLONNE = 'id, campaign_id, owner_id, token_id, name, data, updated_at'
const leggi = (r: Record<string, unknown>) => ({ ...r, data: withDefaults(r.data as Partial<CharacterData>) }) as Scheda

function messaggioErrore(msg: string) {
  if (msg.includes('not_allowed') || msg.includes('row-level security')) return 'Non puoi modificare questa scheda.'
  if (msg.includes('check constraint')) return 'Valore non valido o scheda troppo grande.'
  return msg
}

// Mette un valore dentro data seguendo il percorso, senza toccare il resto (specchio locale di jsonb_set).
function imposta(data: CharacterData, path: string[], value: unknown): CharacterData {
  const out = structuredClone(data) as unknown as Record<string, unknown>
  let o = out
  for (const k of path.slice(0, -1)) {
    if (typeof o[k] !== 'object' || o[k] === null) o[k] = {}
    o = o[k] as Record<string, unknown>
  }
  o[path[path.length - 1]] = value
  return out as unknown as CharacterData
}

// Schede della campagna, abbonamento ai cambi e azioni (contracts/db-api.md).
export function useCharacters(campaignId: string) {
  const [schede, setSchede] = useState<Scheda[] | null>(null) // null = in caricamento
  const [errore, setErrore] = useState('')
  const ref = useRef<Scheda[]>([])
  const set = (s: Scheda[]) => {
    ref.current = s
    setSchede(s)
  }

  const carica = useCallback(async () => {
    const { data, error } = await supabase.from('characters').select(COLONNE).eq('campaign_id', campaignId).order('name')
    if (error) setErrore(error.message)
    else set(data.map(leggi))
  }, [campaignId])

  useEffect(() => {
    // INSERT e UPDATE portano la riga intera: sostituirla è idempotente. DELETE non si filtra lato server.
    const canale = supabase
      .channel(`characters:${campaignId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'characters', filter: `campaign_id=eq.${campaignId}` }, (p) => {
        const n = leggi(p.new)
        set([...ref.current.filter((s) => s.id !== n.id), n].sort((a, b) => a.name.localeCompare(b.name)))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `campaign_id=eq.${campaignId}` }, (p) => {
        const n = leggi(p.new)
        set(ref.current.map((s) => (s.id === n.id ? n : s)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'characters' }, (p) => {
        const id = (p.old as { id?: string }).id
        set(ref.current.filter((s) => s.id !== id))
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') void carica()
      })
    return () => {
      void supabase.removeChannel(canale)
    }
  }, [campaignId, carica])

  // Un campo alla volta: stato locale subito, poi patch_character; se fallisce si rilegge.
  const patch = useCallback(
    async (id: string, path: string[], value: unknown) => {
      set(ref.current.map((s) => (s.id === id ? { ...s, data: imposta(s.data, path, value) } : s)))
      const { error } = await supabase.rpc('patch_character', { p_id: id, p_path: path, p_value: value })
      if (error) {
        setErrore(`Modifica non salvata, riprova. (${messaggioErrore(error.message)})`)
        await carica()
      } else setErrore('')
    },
    [carica],
  )

  const rename = useCallback(async (id: string, name: string) => {
    const { data, error } = await supabase.from('characters').update({ name }).eq('id', id).select('id')
    if (error || !data?.length) setErrore(error ? messaggioErrore(error.message) : 'Non puoi rinominare questa scheda.')
  }, [])

  const roll = useCallback(async (id: string, label: string, modifier: number) => {
    const { error } = await supabase.rpc('roll_character', { p_character: id, p_label: label, p_modifier: Math.max(-20, Math.min(20, modifier)) })
    if (error) setErrore(error.message.includes('not_allowed') ? 'Puoi tirare solo per i tuoi personaggi.' : error.message)
  }, [])

  // Crea una o più schede in un solo insert: o tutte o nessuna. Restituisce gli id, o null in errore.
  const create = useCallback(
    async (righe: { name: string; owner_id: string | null; data?: Partial<CharacterData> }[]) => {
      const { data, error } = await supabase
        .from('characters')
        .insert(righe.map((r) => ({ campaign_id: campaignId, owner_id: r.owner_id, name: r.name, data: r.data ?? {} })))
        .select('id')
      if (error) {
        setErrore(messaggioErrore(error.message))
        return null
      }
      setErrore('')
      return data.map((r) => r.id as string)
    },
    [campaignId],
  )

  const replace = useCallback(async (id: string, name: string, data: CharacterData) => {
    const { data: r, error } = await supabase.from('characters').update({ name, data }).eq('id', id).select('id')
    if (error || !r?.length) setErrore(error ? messaggioErrore(error.message) : 'Non puoi sostituire questa scheda.')
    return !error && !!r?.length
  }, [])

  const remove = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('characters').delete().eq('id', id).select('id')
    if (error || !data?.length) setErrore(error ? messaggioErrore(error.message) : 'Non puoi eliminare questa scheda.')
  }, [])

  return { schede, errore, patch, rename, roll, create, replace, remove }
}
