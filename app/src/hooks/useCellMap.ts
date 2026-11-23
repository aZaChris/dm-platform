import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyPatch, emptyCells, invertPatch, type Patch } from '../lib/cells'

export type CellMap = { cols: number; rows: number; cells: string; active: boolean }

const ERRORE_TRATTO = 'Ultimo tratto non salvato, rifallo.'
const COLONNE = 'cols, rows, cells, active'

// Legge la mappa a celle della campagna e resta abbonato ai cambi. Annulla/ripeti vivono solo qui (sessione).
export function useCellMap(campaignId: string) {
  const [map, setMap] = useState<CellMap | null>(null)
  const [errore, setErrore] = useState('')
  const [pile, setPile] = useState({ undo: 0, redo: 0 })
  const mapRef = useRef<CellMap | null>(null)
  // ponytail: annulla/ripeti sono per scheda; con due schede del DM aperte non si coordinano.
  const undoRef = useRef<Patch[]>([])
  const redoRef = useRef<Patch[]>([])

  const set = useCallback((m: CellMap | null) => {
    mapRef.current = m
    setMap(m)
  }, [])
  const contaPile = () => setPile({ undo: undoRef.current.length, redo: redoRef.current.length })

  const rileggi = useCallback(async () => {
    const { data } = await supabase.from('cell_maps').select(COLONNE).eq('campaign_id', campaignId).maybeSingle()
    set((data as CellMap | null) ?? null)
  }, [campaignId, set])

  useEffect(() => {
    undoRef.current = []
    redoRef.current = []
    contaPile()
    // INSERT e UPDATE portano la riga intera: sostituirla è idempotente. DELETE non si filtra lato server.
    const canale = supabase
      .channel(`cells:${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cell_maps', filter: `campaign_id=eq.${campaignId}` }, (p) => {
        if (p.eventType === 'DELETE') return
        set(p.new as CellMap)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cell_maps' }, (p) => {
        if ((p.old as { campaign_id?: string }).campaign_id === campaignId) set(null)
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') void rileggi() // primo ingresso o riconnessione: stato reale
      })
    return () => {
      void supabase.removeChannel(canale)
    }
  }, [campaignId, rileggi, set])

  // Invia un tratto: stato locale subito, poi la RPC; se fallisce si rilegge e si avvisa.
  const invia = useCallback(
    async (patch: Patch) => {
      const m = mapRef.current
      if (!m || patch.length === 0) return false
      set({ ...m, cells: applyPatch(m.cells, patch) })
      const { error } = await supabase.rpc('paint_cells', { p_campaign: campaignId, p_patch: patch })
      if (error) {
        setErrore(ERRORE_TRATTO)
        await rileggi()
        return false
      }
      setErrore('')
      return true
    },
    [campaignId, rileggi, set],
  )

  const paint = useCallback(
    async (patch: Patch) => {
      const m = mapRef.current
      if (!m) return
      const inverso = invertPatch(m.cells, patch)
      if (await invia(patch)) {
        undoRef.current.push(inverso)
        redoRef.current = []
        contaPile()
      }
    },
    [invia],
  )

  const sposta = useCallback(
    async (da: Patch[], a: Patch[]) => {
      const inverso = da.pop()
      const m = mapRef.current
      if (!inverso || !m) return
      const rifai = invertPatch(m.cells, inverso)
      if (await invia(inverso)) a.push(rifai)
      else da.push(inverso)
      contaPile()
    },
    [invia],
  )
  const undo = useCallback(() => sposta(undoRef.current, redoRef.current), [sposta])
  const redo = useCallback(() => sposta(redoRef.current, undoRef.current), [sposta])

  const create = useCallback(
    async (cols: number, rows: number) => {
      const { error } = await supabase.from('cell_maps').insert({ campaign_id: campaignId, cols, rows, cells: emptyCells(cols, rows) })
      if (error) setErrore('Non sono riuscito a creare la mappa.')
      else {
        setErrore('')
        undoRef.current = []
        redoRef.current = []
        contaPile()
        await rileggi()
      }
    },
    [campaignId, rileggi],
  )

  const clear = useCallback(async () => {
    const m = mapRef.current
    if (!m) return
    const vuota = emptyCells(m.cols, m.rows)
    set({ ...m, cells: vuota })
    const { error } = await supabase.from('cell_maps').update({ cells: vuota, updated_at: new Date().toISOString() }).eq('campaign_id', campaignId)
    if (error) {
      setErrore('Non sono riuscito a svuotare la mappa.')
      await rileggi()
    } else {
      undoRef.current = []
      redoRef.current = []
      contaPile()
    }
  }, [campaignId, rileggi, set])

  // Restituisce quanti token sono stati riportati dentro il bordo (null se la chiamata fallisce).
  const resize = useCallback(
    async (cols: number, rows: number) => {
      const { data, error } = await supabase.rpc('resize_cell_map', { p_campaign: campaignId, p_cols: cols, p_rows: rows })
      if (error) {
        setErrore('Non sono riuscito a cambiare la dimensione.')
        return null
      }
      setErrore('')
      undoRef.current = []
      redoRef.current = []
      contaPile()
      await rileggi()
      return (data as number) ?? 0
    },
    [campaignId, rileggi],
  )

  // Attivando si riallineano i token alle dimensioni attuali (vedi contracts/db-api.md).
  const setActive = useCallback(
    async (active: boolean) => {
      const m = mapRef.current
      if (!m) return
      const { error } = await supabase.from('cell_maps').update({ active }).eq('campaign_id', campaignId)
      if (error) return setErrore('Non sono riuscito a cambiare la mappa mostrata.')
      setErrore('')
      if (active) await supabase.rpc('resize_cell_map', { p_campaign: campaignId, p_cols: m.cols, p_rows: m.rows })
      await rileggi()
    },
    [campaignId, rileggi],
  )

  const remove = useCallback(async () => {
    const { error } = await supabase.from('cell_maps').delete().eq('campaign_id', campaignId)
    if (error) setErrore('Non sono riuscito a eliminare la mappa a celle.')
    else set(null)
  }, [campaignId, set])

  return { map, errore, canUndo: pile.undo > 0, canRedo: pile.redo > 0, create, paint, undo, redo, clear, resize, setActive, remove }
}
