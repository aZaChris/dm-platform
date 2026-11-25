<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (PATCH)
- Modificato: Vincoli tecnici, frase sui dadi allineata al codice (dalla migrazione 0006 il tiro
  lo fa il database con roll_d20; la feature 003 lo mostra nella chat)
- Principi aggiunti/rimossi: nessuno
- Template: plan-template.md ✅ (Constitution Check generico, nessuna modifica),
  spec-template.md ✅, tasks-template.md ✅
- TODO rimandati: nessuno
-->
# DM Platform Constitution

Tavolo virtuale D&D personale: una rivisitazione leggera di Roll20 per vivere
un'avventura nel modo più fluido possibile.

## Core Principles

### I. Peso minimo (NON-NEGOZIABILE)
Il progetto MUST restare nell'ordine dei MB, non dei GB. Ogni dipendenza MUST essere
giustificata nel plan; tra due soluzioni equivalenti si sceglie quella con meno dipendenze
e bundle più piccolo. Una nuova libreria è ammessa solo se sostituisce più codice di
quanto ne aggiunge in peso.

### II. Nessun backend proprio
Frontend React + Vite su Vercel; Supabase cloud (Auth, Postgres con RLS, Realtime,
Storage) è l'unico backend. È vietato introdurre server applicativi, Docker o servizi
self-hosted (Django, NestJS, Coolify, Jitsi self-hosted incluse).

### III. Niente codice che un servizio gestito già fornisce
Autenticazione, permessi DM/Player (via RLS), realtime, presenza e storage file MUST
usare le funzioni native di Supabase. Non si riscrivono JWT, gateway WebSocket o
sistemi di permessi applicativi.

### IV. Semplicità e YAGNI
Uso personale: niente astrazioni, configurazioni o livelli per esigenze solo ipotetiche.
Si scrive il minimo codice che soddisfa la spec. Le semplificazioni deliberate con un
limite noto sono marcate nel codice con un commento che indica quando rivederle.

### V. Funzioni core e riferimento v1
L'ambito del prodotto è: chat, videochiamata (embed Jitsi o LiveKit/Daily, mai
self-host), tiro dadi, mappa con griglia e token (react-konva), gestione turni e
iniziativa, scheda 5e. Altro è fuori ambito finché non emendato. Il codice v1 (tag
`legacy-v1`) è solo documentazione del modello di dominio, MUST NOT essere riusato come
base di codice.

## Vincoli tecnici

- Stack fisso: React, Vite, Supabase cloud, Vercel, `react-konva` per la mappa.
- Il tiro dei dadi lo fa il database, così non è truccabile dal browser; il risultato compare
  in chat via Realtime.
- Tutti i dati condivisi hanno policy RLS; nessuna tabella senza RLS.
- Lingua dei documenti (spec, plan, tasks, commit): italiano.

## Flusso di lavoro

- Ogni feature passa da spec-kit: specify → plan → tasks → implement.
- Il plan MUST includere il Constitution Check contro i principi I–V.
- I test sono richiesti solo per logica non banale (es. dadi, ordine di iniziativa),
  nella forma più piccola che fallisce se la logica si rompe.
- Il corpo del commit spiega il perché della modifica.

## Governance

Questa costituzione prevale sulle altre pratiche. Un emendamento richiede di modificare
questo file, aggiornare la versione e annotare il motivo nel commit. Versionamento
semantico: MAJOR per rimozione o ridefinizione di principi, MINOR per nuovi principi o
sezioni, PATCH per chiarimenti. Ogni plan verifica la conformità; le violazioni vanno
giustificate nella tabella Complexity Tracking del plan.

**Version**: 1.0.1 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-25
