# Implementation Plan: Misurazione delle distanze

**Branch**: `005-misura-distanze` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-misura-distanze/spec.md`

## Summary

Un pulsante «Righello» nella barra della mappa: con il righello attivo si trascina da una cella a un'altra e una linea
con l'etichetta «6 celle · 30 ft · 9 m» unisce i due centri. La misura viaggia agli altri membri con **Realtime
Broadcast** su un canale **privato** `ruler:<campagna>`, protetto da policy RLS su `realtime.messages` che riusano
`is_member`: niente tabella, niente salvataggio. La regola della distanza (ogni diagonale vale una cella) è una funzione
pura con test. Nessuna dipendenza nuova. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7, React 18, Vite 8, come nelle feature precedenti

**Primary Dependencies**: nessuna nuova. `@supabase/supabase-js` (Broadcast su canale privato), `react-konva` (linea ed
etichetta sulla mappa).

**Storage**: nessuna tabella. Migrazione `0012_righello.sql` con le due policy su `realtime.messages`.

**Testing**: Vitest per la regola della distanza (`app/src/lib/ruler.test.ts`): orizzontale, verticale, diagonale,
misto, stessa cella, metri con la virgola. Realtime e permessi con [quickstart.md](quickstart.md) e due utenti.

**Target Platform**: browser moderni, desktop, tablet e telefono; deploy automatico su Vercel

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: misura visibile agli altri in <1 s (p95); un messaggio per cella attraversata

**Constraints**: JS al primo caricamento <500 KB gzip (oggi 220,7 KB); nessun backend proprio; nessun dato condiviso
senza RLS

**Scale/Scope**: ~6 membri, una misura per persona alla volta

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Zero dipendenze. Stima +2-3 KB gzip (funzione, hook, disegno): da misurare. |
| II. Nessun backend proprio | ✅ | Broadcast di Supabase da client a client; nessun servizio nuovo. |
| III. Niente codice già fornito | ✅ | Tempo reale e permessi con Realtime Broadcast e Realtime Authorization (RLS su `realtime.messages`), non un canale nostro. |
| IV. YAGNI | ✅ | Niente misure salvate, percorsi a tappe, aree d'effetto o scale diverse (Assunzioni della spec). |
| V. Ambito | ✅ | «Mappa con griglia e token» è una funzione core (costituzione 2.0.0). |

**Rivalutazione dopo Phase 1**: invariata.

## Project Structure

### Documentation (this feature)

```text
specs/005-misura-distanze/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/realtime.md
├── checklists/requirements.md
└── tasks.md             # prodotto da /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 0012_righello.sql        # policy di lettura e invio su realtime.messages per il topic ruler:<campagna>

app/src/
├── lib/
│   ├── ruler.ts             # distance(from, to) → { cells, ft, m }, formatDistance
│   └── ruler.test.ts
├── hooks/
│   └── useRuler.ts          # canale privato, misura propria, misure degli altri con scadenza a 3 s
├── components/
│   └── MapCanvas.tsx        # strumento righello: niente trascinamento né pittura, linea ed etichetta Konva
└── pages/
    └── Table.tsx            # pulsante «Righello» (R) nella barra della mappa, frecce dal token scelto, Esc
```

**Structure Decision**: come le feature precedenti: una migrazione, logica pura in `lib/` con il test, un hook per il
tempo reale, il disegno dentro `MapCanvas`.

## Complexity Tracking

| Scelta da giustificare | Perché serve | Alternativa più semplice scartata |
|---|---|---|
| Canale privato con policy su `realtime.messages` invece di un canale pubblico | La costituzione vuole RLS su ogni dato condiviso; un canale pubblico si ascolta conoscendo solo l'id della campagna | Canale pubblico: chiunque abbia l'id vedrebbe e manderebbe misure (research, punto 2) |
