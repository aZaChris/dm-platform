import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { nextTurn, prevTurn, sortParticipants, tied, turnAfterRemoval, type Participant, type Turn } from '../lib/initiative'

export type Encounter = { campaign_id: string; started: boolean; round: number; turn_token_id: string | null }

function messaggioErrore(msg: string) {
  if (msg.includes('not_allowed')) return "Non puoi tirare l'iniziativa di questo token."
  if (msg.includes('not_participant')) return 'Questo token non è nel combattimento.'
  if (msg.includes('check constraint')) return "Valore fuori dai limiti (iniziativa da -20 a 60, modificatore da -20 a 20)."
  return msg
}

// Combattimento della campagna (al massimo uno) e i suoi partecipanti, con abbonamento ai cambi.
// L'ordine e i turni si calcolano con le funzioni pure di lib/initiative.ts; la RLS decide chi può scrivere.
export function useEncounter(campaignId: string, isDm: boolean) {
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [errore, setErrore] = useState('')
  const ordine = useMemo(() => sortParticipants(participants), [participants])

  // Ultimo stato visto, per il gestore dei DELETE: serve l'ordine di prima della rimozione.
  const statoRef = useRef({ encounter, ids: ordine.map((p) => p.token_id), isDm })
  statoRef.current = { encounter, ids: ordine.map((p) => p.token_id), isDm }

  const carica = useCallback(async () => {
    const [e, p] = await Promise.all([
      supabase.from('encounters').select('campaign_id, started, round, turn_token_id').eq('campaign_id', campaignId).maybeSingle(),
      supabase.from('encounter_participants').select('*').eq('campaign_id', campaignId),
    ])
    setEncounter((e.data as Encounter | null) ?? null)
    setParticipants((p.data as Participant[] | null) ?? [])
  }, [campaignId])

  const scriviTurno = useCallback(
    async (t: Turn | null) => {
      const { error } = await supabase
        .from('encounters')
        .update({ turn_token_id: t?.turn ?? null, round: t?.round ?? statoRef.current.encounter?.round ?? 1, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
      if (error) setErrore(error.message)
    },
    [campaignId],
  )

  useEffect(() => {
    const filtro = `campaign_id=eq.${campaignId}`
    const canale = supabase
      .channel(`combat:${campaignId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encounters', filter: filtro }, (p) => setEncounter(p.new as Encounter))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'encounters', filter: filtro }, (p) => setEncounter(p.new as Encounter))
      // I DELETE portano solo la chiave primaria e non si filtrano lato server.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'encounters' }, (p) => {
        if ((p.old as { campaign_id?: string }).campaign_id !== campaignId) return
        setEncounter(null)
        setParticipants([])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encounter_participants', filter: filtro }, (p) => {
        if (p.eventType === 'DELETE') return // gestito sotto, senza filtro
        const nuovo = p.new as Participant
        setParticipants((ps) => (ps.some((x) => x.token_id === nuovo.token_id) ? ps.map((x) => (x.token_id === nuovo.token_id ? nuovo : x)) : [...ps, nuovo]))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'encounter_participants' }, (p) => {
        const tolto = (p.old as { token_id?: string }).token_id
        const { encounter: e, ids, isDm: dm } = statoRef.current
        if (!tolto || !ids.includes(tolto)) return // non è di questa campagna
        setParticipants((ps) => ps.filter((x) => x.token_id !== tolto))
        // Tolto chi era di turno (dal pannello o eliminando il token): il DM passa il turno al successivo.
        // ponytail: con due schede del DM aperte lo fanno entrambe; stesso risultato, una scrittura in più.
        if (dm && e?.started && e.turn_token_id === tolto) void scriviTurno(turnAfterRemoval(ids, tolto, e.round))
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') void carica() // primo ingresso o riconnessione
      })
    return () => {
      void supabase.removeChannel(canale)
    }
  }, [campaignId, carica, scriviTurno])

  // Esegue una scrittura che deve toccare almeno una riga: 0 righe = la RLS l'ha rifiutata.
  const scrivi = useCallback(async (q: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>, rifiuto: string) => {
    const { data, error } = await q
    if (error || !data?.length) {
      setErrore(error ? messaggioErrore(error.message) : rifiuto)
      return false
    }
    setErrore('')
    return true
  }, [])

  const start = useCallback(
    async (tokenIds: string[]) => {
      const { error } = await supabase.from('encounters').insert({ campaign_id: campaignId })
      if (error) return setErrore(error.message)
      const { error: e2 } = await supabase.from('encounter_participants').insert(tokenIds.map((token_id) => ({ campaign_id: campaignId, token_id })))
      setErrore(e2 ? e2.message : '')
    },
    [campaignId],
  )

  const setInitiative = useCallback(
    (tokenId: string, initiative: number, modifier: number) =>
      scrivi(supabase.from('encounter_participants').update({ initiative, modifier }).eq('token_id', tokenId).select('token_id'), "Non puoi cambiare l'iniziativa di questo token."),
    [scrivi],
  )

  const rollInitiative = useCallback(async (tokenId: string, modifier: number) => {
    const { error } = await supabase.rpc('roll_initiative', { p_token: tokenId, p_modifier: modifier })
    setErrore(error ? messaggioErrore(error.message) : '')
  }, [])

  // Il DM scambia un partecipante con il precedente in pari: rinumera il tiebreak di tutto il gruppo in pari,
  // altrimenti con tre pari il terzo salterebbe in cima invece di salire di un posto.
  const moveUp = useCallback(
    async (tokenId: string) => {
      const i = ordine.findIndex((p) => p.token_id === tokenId)
      if (i <= 0 || !tied(ordine[i], ordine[i - 1])) return false
      const gruppo = ordine.filter((p) => tied(p, ordine[i]))
      const j = gruppo.findIndex((p) => p.token_id === tokenId)
      ;[gruppo[j - 1], gruppo[j]] = [gruppo[j], gruppo[j - 1]]
      const esiti = await Promise.all(
        gruppo.map((p, k) => scrivi(supabase.from('encounter_participants').update({ tiebreak: gruppo.length - k }).eq('token_id', p.token_id).select('token_id'), "Solo il DM può cambiare l'ordine.")),
      )
      return esiti.every(Boolean)
    },
    [ordine, scrivi],
  )

  const begin = useCallback(
    () => scrivi(supabase.from('encounters').update({ started: true, round: 1, turn_token_id: ordine[0]?.token_id ?? null }).eq('campaign_id', campaignId).select('campaign_id'), 'Solo il DM può iniziare.'),
    [campaignId, ordine, scrivi],
  )

  const next = useCallback(() => {
    const e = statoRef.current.encounter
    if (!e?.turn_token_id || ordine.length === 0) return
    void scriviTurno(nextTurn(statoRef.current.ids, e.turn_token_id, e.round))
  }, [ordine.length, scriviTurno])

  const prev = useCallback(() => {
    const e = statoRef.current.encounter
    if (!e?.turn_token_id) return
    const t = prevTurn(statoRef.current.ids, e.turn_token_id, e.round)
    if (t) void scriviTurno(t)
  }, [scriviTurno])

  const add = useCallback(
    async (tokenId: string) => {
      const { error } = await supabase.from('encounter_participants').insert({ campaign_id: campaignId, token_id: tokenId })
      setErrore(error ? error.message : '')
    },
    [campaignId],
  )

  const remove = useCallback(
    (tokenId: string) => scrivi(supabase.from('encounter_participants').delete().eq('token_id', tokenId).select('token_id'), 'Solo il DM può togliere partecipanti.'),
    [scrivi],
  )

  const end = useCallback(
    () => scrivi(supabase.from('encounters').delete().eq('campaign_id', campaignId).select('campaign_id'), 'Solo il DM può terminare il combattimento.'),
    [campaignId, scrivi],
  )

  return { encounter, ordine, errore, start, setInitiative, rollInitiative, moveUp, begin, next, prev, add, remove, end }
}
