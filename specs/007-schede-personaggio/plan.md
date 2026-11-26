# Implementation Plan: Schede personaggio

**Branch**: `007-schede-personaggio` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-schede-personaggio/spec.md`

## Summary

Ogni campagna ha schede personaggio D&D 5e complete, con due viste e un interruttore: **pratica** (per giocare, nel
pannello del tavolo e nella pagina Schede) e **classica** (la disposizione della scheda su carta, disegnata da noi,
nella pagina Schede). Una tabella nuova, `characters`: poche colonne vere per permessi, token e nome, e il resto
della scheda in `data jsonb`. Le modifiche passano da `patch_character`, che scrive un campo alla volta, così DM e
giocatore non si cancellano a vicenda. I valori derivati (modificatori, competenza, abilità, CD) sono **funzioni
pure nel client**, con test. I tiri dalla scheda passano da `roll_character`, che controlla il proprietario e
**riusa `roll_d20`**. L'import da Roll20 legge nel browser il JSON di VTT Enhancement Suite con un convertitore
puro e testato. Nessuna dipendenza nuova. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7, React 18, Vite 8, come nelle feature precedenti

**Primary Dependencies**: nessuna nuova. `@supabase/supabase-js` per tabella, RPC, Realtime e metadati utente.

**Storage**: Supabase Postgres, tabella `characters` con RLS e un trigger, funzioni `patch_character` e
`roll_character`. Nessuno Storage: il file Roll20 si legge nel browser e non si carica.

**Testing**: Vitest per la logica non banale, come chiede la costituzione:
- `app/src/lib/character.test.ts`: modificatori, competenza per livello (1, 4, 5, 11, 17, 20), tiri salvezza,
  abilità con maestria, CD, percezione passiva, `applyHp` (temporanei, minimo 0, massimo).
- `app/src/lib/roll20.test.ts`: un export anonimizzato del gruppo → scheda attesa; attributi sconosciuti in
  `notes_import`; file non valido → errore.

Permessi e tempo reale con [quickstart.md](quickstart.md) e due utenti reali.

**Target Platform**: browser moderni, desktop, tablet e telefono; deploy su Vercel (da Git, Root Directory `app`)

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: modifica visibile agli altri in <1 s (p95); tiro dalla scheda in un clic; import di un
personaggio in <1 min

**Constraints**: JS al primo caricamento <500 KB gzip (oggi 200,5 KB); nessun backend proprio; nessuna tabella senza
RLS; nessuna grafica della scheda ufficiale WotC

**Scale/Scope**: ~6 membri, qualche scheda per campagna, una scheda pesa pochi KB (limite 256 KB)

**Dato ancora da confermare**: i nomi esatti degli attributi Roll20. La tabella in
[contracts/roll20-import.md](contracts/roll20-import.md) si verifica sul primo JSON reale prima di scrivere il
convertitore; non blocca né il database né le viste.

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Zero dipendenze nuove. La vista classica è griglia CSS, non un PDF o un editor. Stima +15-20 KB gzip (due viste, import, calcoli): da **misurare**; la pagina Schede si carica a parte (`import()` dinamico) se supera i 10 KB. |
| II. Nessun backend proprio | ✅ | Solo Supabase e Vercel statico; parsing del file nel browser, funzioni nel database. |
| III. Niente codice già fornito | ✅ | Permessi con RLS e un trigger, sincronizzazione con Realtime nativo, preferenza nei metadati di Supabase Auth. Il tiro riusa `roll_d20`. |
| IV. YAGNI | ✅ | Niente tabelle per attacchi o incantesimi, niente storico delle modifiche, niente dadi generici, niente ritratti, schede segrete o export. I limiti noti avranno un `ponytail:`. |
| V. Ambito e riferimento v1 | ✅ | «Scheda 5e» è una funzione core della costituzione. |

**Rivalutazione dopo Phase 1**: invariata. Il JSON in una colonna è giustificato in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/007-schede-personaggio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── db-api.md
│   └── roll20-import.md
├── checklists/requirements.md
└── tasks.md             # prodotto da /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 0011_schede.sql          # characters, RLS, trigger dei campi del DM, patch_character, roll_character, Realtime

app/src/
├── lib/
│   ├── character.ts         # tipi, default, valori calcolati, applyHp
│   ├── character.test.ts
│   ├── roll20.ts            # fromRoll20: export VTT Enhancement Suite → scheda
│   ├── roll20.test.ts
│   └── __fixtures__/roll20-esempio.json   # export reale anonimizzato
├── hooks/
│   └── useCharacters.ts     # elenco, abbonamento Realtime, patch, roll, crea, importa, elimina
├── components/
│   ├── SheetPractical.tsx   # vista pratica (pannello del tavolo e pagina Schede)
│   ├── SheetClassic.tsx     # vista classica
│   ├── SheetField.tsx       # campo modificabile che salva all'uscita e rispetta il focus
│   └── Roll20Import.tsx     # scelta file, riepilogo, assegnazione, conferma
├── pages/
│   ├── Characters.tsx       # #/schede/<campagna>: elenco + scheda + interruttore
│   └── Table.tsx            # + scheda «Scheda» nel pannello
├── components/Shell.tsx     # + voce «Schede»
├── App.tsx                  # + rotta #/schede
└── index.css                # stili delle due viste con i token di DESIGN.md

import/roll20/               # JSON reali del gruppo, esclusi da git
```

**Structure Decision**: stessa struttura delle feature 001-004: una migrazione, logica pura in `lib/` con i test,
un hook per i dati condivisi, componenti per le viste. Una pagina nuova per la vista classica; la vista pratica
entra anche nel pannello a schede del tavolo.

## Complexity Tracking

| Scelta da giustificare | Perché serve | Alternativa più semplice scartata |
|---|---|---|
| Scheda in una colonna `jsonb` invece che in colonne e tabelle | Oltre cento campi e cinque liste che si leggono sempre insieme; una riga = una query, un canale, un insert per l'import | Tabelle normalizzate: 5 tabelle, 5 policy e 5 canali per gli stessi dati (research, punto 1) |
| RPC `patch_character` invece di `update` diretto | Due persone sulla stessa scheda non devono cancellarsi i campi (FR-008) | `update` dell'intero JSON: vince l'ultimo e perde i campi dell'altro (research, punto 2) |
| Trigger sui campi del DM | La RLS non vede il valore vecchio: senza trigger un giocatore potrebbe cambiarsi proprietario o token | Privilegi di colonna: bloccherebbero anche il DM (research, punto 5) |
