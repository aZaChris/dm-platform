import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Cell } from '../lib/ruler'

export type Measure = { id: string; name: string; from: Cell; to: Cell; mine: boolean }
type Altra = { name: string; from: Cell; to: Cell; visto: number }

const SCADENZA_MS = 3000 // senza aggiornamenti per 3 s la misura di un altro sparisce (connessione caduta)
const RIPETI_MS = 1000 // la propria misura ferma si rimanda ogni secondo, così non scade per gli altri

// Righello condiviso (feature 005): Broadcast sul canale privato ruler:<campagna>, niente database.
// Le policy di 0012_righello.sql fanno passare solo i membri della campagna.
export function useRuler(campaignId: string, userId: string, name: string, condividi = true) {
  const [mia, setMia] = useState<{ from: Cell; to: Cell } | null>(null)
  const [altre, setAltre] = useState<Record<string, Altra>>({})
  const canale = useRef<RealtimeChannel | null>(null)
  const miaRef = useRef(mia)
  const condividiRef = useRef(condividi) // in un ref: cambiando scena il canale non va riaperto
  condividiRef.current = condividi
  miaRef.current = mia

  const manda = useCallback(
    (misura: { from: Cell; to: Cell } | null) => {
      const c = canale.current
      if (!c) return
      if (misura && !condividiRef.current) return
      if (misura) void c.send({ type: 'broadcast', event: 'move', payload: { user_id: userId, name, ...misura } })
      else void c.send({ type: 'broadcast', event: 'end', payload: { user_id: userId } })
    },
    [userId, name],
  )

  useEffect(() => {
    const c = supabase
      .channel(`ruler:${campaignId}`, { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const p = payload as { user_id: string; name: string; from: Cell; to: Cell }
        setAltre((a) => ({ ...a, [p.user_id]: { name: p.name, from: p.from, to: p.to, visto: Date.now() } }))
      })
      .on('broadcast', { event: 'end' }, ({ payload }) => {
        const id = (payload as { user_id: string }).user_id
        setAltre((a) => {
          const { [id]: _, ...resto } = a
          return resto
        })
      })
      .subscribe()
    canale.current = c
    // Ogni secondo: rimanda la propria misura aperta e toglie quelle degli altri scadute.
    const giro = setInterval(() => {
      if (miaRef.current) manda(miaRef.current)
      const ora = Date.now()
      setAltre((a) => (Object.values(a).some((x) => ora - x.visto > SCADENZA_MS)
        ? Object.fromEntries(Object.entries(a).filter(([, x]) => ora - x.visto <= SCADENZA_MS))
        : a))
    }, RIPETI_MS)
    return () => {
      clearInterval(giro)
      if (miaRef.current) manda(null)
      canale.current = null
      void supabase.removeChannel(c)
    }
  }, [campaignId, manda])

  // La propria misura: stato locale subito, messaggio agli altri solo se cambia davvero (cella diversa).
  const measure = useCallback(
    (from: Cell, to: Cell | null) => {
      const prima = miaRef.current
      if (!to) {
        if (prima) manda(null)
        setMia(null)
        return
      }
      if (prima && prima.from[0] === from[0] && prima.from[1] === from[1] && prima.to[0] === to[0] && prima.to[1] === to[1]) return
      setMia({ from, to })
      manda({ from, to })
    },
    [manda],
  )

  const measures: Measure[] = [
    ...(mia ? [{ id: userId, name, from: mia.from, to: mia.to, mine: true }] : []),
    ...Object.entries(condividi ? altre : {}).map(([id, x]) => ({ id, name: x.name, from: x.from, to: x.to, mine: false })),
  ]
  return { measures, mia, measure }
}
