# Implementation Plan: Chat del tavolo

**Branch**: `003-chat-tavolo` (cartella della spec; il lavoro resta su `refactor/react-supabase`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-chat-tavolo/spec.md`

## Summary

I membri si scrivono in una chat accanto alla mappa. Ogni messaggio è **una riga della nuova tabella** `messages`,
scritta direttamente dal client con un `insert`: la RLS decide chi può scrivere e chi può leggere, compresi i
sussurri (`recipient_id`). Un trigger copia il nome del mittente da `campaign_members`, così nessuno può firmarsi
con un altro nome. Realtime (Postgres Changes) consegna i messaggi a chi ha il permesso di leggerli. I tiri
restano nella tabella `rolls`: il componente della chat **unisce i due elenchi per ora** e sostituisce il diario
dei tiri dentro `DiceRoller`. Nessuna dipendenza nuova. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 18, Node per il build come nelle feature precedenti

**Primary Dependencies**: nessuna nuova. `@supabase/supabase-js` per tabella e Realtime.

**Storage**: Supabase Postgres, nuova tabella `messages` con RLS e un trigger (`set_message_author`). Nessuno Storage.

**Testing**: nessun test unitario nuovo: l'unica logica è unire due elenchi ordinati per data, che non è logica
non banale secondo la costituzione. Permessi (sussurri, non membri) e tempo reale si verificano con
[quickstart.md](quickstart.md) usando tre utenti reali.

**Target Platform**: browser moderni, desktop e tablet; deploy statico su Vercel

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: messaggio visibile agli altri in <1 s (p95); tavolo con 500 messaggi che si apre senza ritardi

**Constraints**: JS al primo caricamento <500 KB gzip (oggi ~202 KB); nessun backend proprio; nessuna tabella senza RLS

**Scale/Scope**: ~6 membri per campagna; si caricano solo gli ultimi 100 messaggi e gli ultimi 100 tiri

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Zero dipendenze nuove. Stima +2-3 KB gzip (componente e hook): da **misurare** con `vite build`. |
| II. Nessun backend proprio | ✅ | Solo Supabase e Vercel statico. Il trigger vive nel database, non è un server. |
| III. Niente codice già fornito | ✅ | Permessi e sussurri con RLS, consegna con Realtime nativo (che applica la RLS a ogni abbonato). Nessuna funzione RPC per scrivere: un `insert` diretto basta. |
| IV. YAGNI | ✅ | Una tabella, una colonna per il sussurro, niente modifica, niente paginazione, niente "sta scrivendo". I limiti noti hanno un `ponytail:`. |
| V. Ambito e riferimento v1 | ✅ | La chat è una funzione core citata dalla costituzione. |

**Nota sulla costituzione**: i *Vincoli tecnici* dicono «la logica dei dadi vive nel client; il risultato è pubblicato
in chat via Realtime». Dalla 0006 il tiro lo fa il database (`roll_d20`), per evitare tiri truccati. Questo piano
mostra i tiri nella chat **leggendo `rolls`**, senza copiarli in `messages`. Va proposto un emendamento PATCH che
allinei la frase al codice: «il tiro lo fa il database; il risultato compare in chat via Realtime». Non blocca il piano.

**Rivalutazione dopo Phase 1**: invariata. Il solo punto da giustificare è il trigger, in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-chat-tavolo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/db-api.md
├── checklists/requirements.md
└── tasks.md             # prodotto da /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 0009_chat.sql            # tabella messages, RLS, trigger del nome, Realtime

app/src/
├── hooks/
│   ├── useChat.ts           # carica gli ultimi 100 messaggi, si abbona, send/remove
│   └── useTable.ts          # i tiri caricati passano da 20 a 100
├── components/
│   ├── Chat.tsx             # flusso unito messaggi + tiri, campo, destinatario, conteggio caratteri
│   └── DiceRoller.tsx       # resta solo il form del tiro: il diario passa nella chat
└── pages/
    └── Table.tsx            # la card della chat nella colonna laterale
```

**Structure Decision**: web-app esistente `app/` + `supabase/`; si aggiungono una migrazione, un hook e un
componente. Come per la mappa a celle (002), la chat ha **un hook e un canale suoi** invece di allargare
`useTable.ts`, che è già il file più lungo del progetto.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Trigger `set_message_author` | Imposta `user_id = auth.uid()` e copia `display_name` da `campaign_members`: il nome del mittente non è falsificabile e resta anche se il membro viene rimosso (edge case della spec) | Nome scritto dal client: un membro potrebbe firmarsi come un altro. Nome letto dall'elenco membri al momento di mostrare: chi è stato rimosso non c'è più nell'elenco e i suoi messaggi resterebbero senza nome. Una RPC `send_message` come `roll_d20` funzionerebbe, ma sposterebbe i permessi dalla RLS al codice SQL (principio III). |
