import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyPatch, emptyCells, invertPatch, type Patch } from '../lib/cells'
import type { Scene, useScenes } from './useScenes'

export type CellMap = { cols: number; rows: number; cells: string; active: boolean }

const ERRORE_TRATTO = 'Ultimo tratto non salvato, rifallo.'

const celleDi = (s: Scene | null): CellMap | null =>
  s?.cells && s.cols && s.rows ? { cols: s.cols, rows: s.rows, cells: s.cells, active: s.cells_active } : null

// Mappa a celle della scena guardata; i dati arrivano da useScenes. Annulla/ripeti vivono solo qui (sessione).
export function useCellMap({ scena, aggiorna, locale, rileggi }: ReturnType<typeof useScenes>) {
  const id = scena?.id
  const map = celleDi(scena)
  const [errore, setErrore] = useState('')
  const [pile, setPile] = useState({ undo: 0, redo: 0 })
  const mapRef = useRef<CellMap | null>(null)
  mapRef.current = map
  // ponytail: annulla/ripeti sono per scheda; con due schede del DM aperte non si coordinano.
  const undoRef = useRef<Patch[]>([])
  const redoRef = useRef<Patch[]>([])

  const contaPile = () => setPile({ undo: undoRef.current.length, redo: redoRef.current.length })
  const azzera = useCallback(() => {
    undoRef.current = []
    redoRef.current = []
    contaPile()
  }, [])
  useEffect(azzera, [id, azzera])

  // Invia un tratto: stato locale subito, poi la RPC; se fallisce si rilegge e si avvisa.
  const invia = useCallback(
    async (patch: Patch) => {
      const m = mapRef.current
      if (!m || !id || patch.length === 0) return false
      const cells = applyPatch(m.cells, patch)
      mapRef.current = { ...m, cells } // subito, per il tratto successivo
      locale(id, { cells })
      const { error } = await supabase.rpc('paint_scene', { p_scene: id, p_patch: patch })
      if (error) {
        setErrore(ERRORE_TRATTO)
        await rileggi()
        return false
      }
      setErrore('')
      return true
    },
    [id, locale, rileggi],
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
      if (id && (await aggiorna(id, { cols, rows, cells: emptyCells(cols, rows), cells_active: true }))) azzera()
    },
    [id, aggiorna, azzera],
  )

  const clear = useCallback(async () => {
    const m = mapRef.current
    if (m && id && (await aggiorna(id, { cells: emptyCells(m.cols, m.rows) }))) azzera()
  }, [id, aggiorna, azzera])

  // Restituisce quanti token sono stati riportati dentro il bordo (null se la chiamata fallisce).
  const resize = useCallback(
    async (cols: number, rows: number) => {
      const { data, error } = await supabase.rpc('resize_scene', { p_scene: id, p_cols: cols, p_rows: rows })
      if (error) {
        setErrore('Non sono riuscito a cambiare la dimensione.')
        return null
      }
      setErrore('')
      azzera()
      await rileggi()
      return (data as number) ?? 0
    },
    [id, rileggi, azzera],
  )

  // Attivando si riallineano i token alle dimensioni attuali.
  const setActive = useCallback(
    async (active: boolean) => {
      const m = mapRef.current
      if (!m || !id || !(await aggiorna(id, { cells_active: active }))) return
      if (active) await supabase.rpc('resize_scene', { p_scene: id, p_cols: m.cols, p_rows: m.rows })
    },
    [id, aggiorna],
  )

  const remove = useCallback(async () => {
    if (id) await aggiorna(id, { cols: null, rows: null, cells: null, cells_active: false })
  }, [id, aggiorna])

  return { map, errore, canUndo: pile.undo > 0, canRedo: pile.redo > 0, create, paint, undo, redo, clear, resize, setActive, remove }
}
