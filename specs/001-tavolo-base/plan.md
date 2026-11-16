# Implementation Plan: Tavolo base

**Branch**: `001-tavolo-base` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-tavolo-base/spec.md`

## Summary

Una SPA React che parla direttamente con Supabase: nessun server nostro. Auth email/password,
campagne e ruoli con RLS, mappa su Storage, token su una tabella Postgres sincronizzata con
Realtime (Postgres Changes). La mappa è un canvas `react-konva`; il token si salva solo a fine
trascinamento (`dragend`), non a ogni frame. Due funzioni SQL (`create_campaign`,
`join_campaign`) coprono i due casi che la sola RLS non sa esprimere. Dettagli in
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (zero costo a runtime), React 18, Node 20 per il build

**Primary Dependencies**: `react`, `react-dom`, `@supabase/supabase-js`, `konva` + `react-konva`.
Dev: `vite`, `typescript`, `vitest`. Nessun router, nessuna libreria di stato, nessun UI kit.

**Storage**: Supabase Postgres (tabelle con RLS) + Supabase Storage (bucket privato `maps`)

**Testing**: Vitest solo per la logica non banale (aggancio alla griglia, limiti mappa).
Le RLS si verificano con la procedura in [quickstart.md](quickstart.md) usando due utenti reali.

**Target Platform**: browser moderni, desktop e tablet; deploy statico su Vercel

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: movimento token visibile agli altri in <1 s (p95); 6 utenti e 50 token fluidi

**Constraints**: JS al primo caricamento <500 KB (gzip, immagini mappa escluse); nessun backend proprio

**Scale/Scope**: ~6 utenti per campagna, poche campagne, 4 schermate (login, campagne, ingresso invito, tavolo)

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | 5 dipendenze runtime. Stima ~150-200 KB gzip da **misurare** con `vite build` (T. quickstart). Router e store scritti in poche righe invece di librerie. |
| II. Nessun backend proprio | ✅ | Solo Supabase + Vercel statico. Le 2 funzioni SQL vivono dentro Supabase, non sono un server. |
| III. Niente codice già fornito | ✅ | Auth, RLS, Realtime, Storage nativi. Nessun WebSocket o JWT scritto a mano. |
| IV. YAGNI | ✅ | Niente immagine sul token, niente più mappe, niente Broadcast durante il drag (vedi research). |
| V. Ambito e riferimento v1 | ✅ | Solo accesso, campagna, mappa, token. Codice v1 non riusato; usato solo il modello di dominio. |

**Rivalutazione dopo Phase 1**: invariata, nessuna violazione. Le 2 funzioni SQL sono giustificate
in Complexity Tracking come scelta, non come eccezione ai principi.

## Project Structure

### Documentation (this feature)

```text
specs/001-tavolo-base/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/db-api.md
└── tasks.md             # prodotto da /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx              # routing a hash scritto a mano (~15 righe)
    ├── lib/
    │   ├── supabase.ts      # client + variabili d'ambiente
    │   ├── grid.ts          # snapToCell, clampToMap
    │   └── grid.test.ts
    ├── hooks/
    │   └── useTable.ts      # carica mappa+token e si abbona ai cambi
    ├── pages/
    │   ├── Login.tsx
    │   ├── Campaigns.tsx
    │   ├── Join.tsx
    │   └── Table.tsx
    └── components/
        ├── MapCanvas.tsx    # Konva: sfondo, griglia, token
        └── DmPanel.tsx      # upload mappa, crea token, invito, rimuovi player
supabase/
└── migrations/
    └── 0001_tavolo_base.sql # tabelle, RLS, funzioni, bucket, publication
```

**Structure Decision**: cartella `app/` per il frontend e `supabase/` per lo schema, così i due
mondi restano separati e Vercel punta a `app/`. Le cartelle v1 (`server/`, `mobile/`,
`web-client/`, `docker-compose.yml`, `__dummy__.ipynb`) si eliminano come primo task: restano
recuperabili dal tag `legacy-v1`.

## Complexity Tracking

| Scelta | Perché serve | Alternativa più semplice scartata perché |
|---|---|---|
| Funzione SQL `create_campaign` | Creare campagna + riga DM in modo atomico; con la sola RLS l'`insert().select()` fallirebbe perché il creatore non è ancora membro | Due insert dal client: non atomici e il secondo richiede una policy di auto-promozione a DM, più rischiosa |
| Funzione SQL `join_campaign(token)` | Riscattare un invito monouso è una transizione (controllo + marcatura + inserimento) che la RLS non esprime | Policy di insert aperta sui membri: chiunque potrebbe unirsi senza invito |
