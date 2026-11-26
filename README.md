# DM Platform

Un tavolo virtuale per giocare di ruolo online: il DM carica una mappa e crea i token, i giocatori entrano
con un link d'invito e muovono i propri token, tutti in tempo reale. In alternativa all'immagine il DM può
disegnare la mappa a celle (vuoto, pavimento, muro, porta, acqua) con pennello, riempimento e gomma.
Accanto alla mappa c'è la chat del tavolo: messaggi e tiri di dado in un solo flusso, e sussurri privati
tra il DM e un giocatore. Per i combattimenti c'è l'iniziativa: tiri o valori a mano, ordine automatico,
turni e round con il token di turno evidenziato sulla mappa.
Ogni personaggio ha la sua scheda D&D 5e, in vista pratica (per giocare, con i tiri a un clic) o classica (la
disposizione della scheda su carta), anche in una finestra mobile sopra la mappa; le schede scritte su Roll20 si
importano dal loro file JSON.

**In produzione**: https://dm-platform-steel.vercel.app

## Stack

- React 18 + TypeScript + Vite (SPA, nessun server nostro)
- Supabase: Auth (email/password), Postgres con RLS, Storage (bucket privato `maps`), Realtime
- Mappa su canvas con `react-konva`; token salvati in celle e sincronizzati con Postgres Changes
- Deploy statico su Vercel (root `app/`)

## Avvio in locale

Servono Node 22 e un progetto Supabase (con "Confirm email" disattivato).

```bash
cd app
cp .env.example .env.local   # poi inserisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:5173
```

Lo schema si applica con `npx supabase link --project-ref <ref>` e `npx supabase db push --remote`
(migrazioni in `supabase/migrations/`, in ordine di numero).

Altri comandi: `npm test` (griglia, riempimento, linea tra celle, annulla, ordine d'iniziativa e turni, calcoli della
scheda e import da Roll20), `npm run build`.

Il deploy è automatico: ogni push su `master` va in produzione (progetto Vercel con Root Directory `app`), ogni
branch ha un'anteprima.

## Importare una scheda da Roll20

1. Su Roll20 esporta il personaggio in JSON (la scheda «D&D 5e OGL»): il file deve avere le sezioni `identity`,
   `abilities`, `skills`, `combat`… Un personaggio per file, o un array di personaggi.
2. Nell'app apri la campagna → **Schede** → **Importa da Roll20** e scegli uno o più file. Il DM sceglie anche a chi
   assegnare ogni personaggio.
3. Controlla il riepilogo e importa. Gli slot arrivano tutti liberi; ciò che la scheda non rappresenta ancora
   (modificatori attivabili, punti eroe…) finisce in «Note importate da Roll20», nella vista classica.

I file dei giocatori non vanno nel repository: tienili in `import/roll20/`, che è esclusa da git.

## Documentazione

- Scenari di verifica: [`specs/001-tavolo-base/quickstart.md`](specs/001-tavolo-base/quickstart.md)
- Specifica, piano e task: cartelle [`specs/001-tavolo-base/`](specs/001-tavolo-base/), [`specs/002-editor-mappe-celle/`](specs/002-editor-mappe-celle/), [`specs/003-chat-tavolo/`](specs/003-chat-tavolo/) e [`specs/004-turni-iniziativa/`](specs/004-turni-iniziativa/) e [`specs/007-schede-personaggio/`](specs/007-schede-personaggio/)
- Scenari di turni e iniziativa: [`specs/004-turni-iniziativa/quickstart.md`](specs/004-turni-iniziativa/quickstart.md)
- Scenari della chat: [`specs/003-chat-tavolo/quickstart.md`](specs/003-chat-tavolo/quickstart.md)
- Scenari dell'editor di mappe: [`specs/002-editor-mappe-celle/quickstart.md`](specs/002-editor-mappe-celle/quickstart.md)
- Problemi risolti: [`docs/knowledge-base/`](docs/knowledge-base/)

## Stato

Feature 001 «tavolo base»: accesso con invito, mappa condivisa, token trascinabili e gestione membri
completati. Feature 002 «editor di mappe a celle»: scritta, migrazioni 0007-0008 applicate e scenari 1-17
verificati in locale e sul dominio pubblico.
Feature 003 «chat del tavolo»: migrazione 0009 applicata, in produzione e verificata sul dominio pubblico
(messaggi, tiri nella chat, sussurri).
Feature 004 «turni e iniziativa»: migrazione 0010 applicata e in produzione.
Feature 007 «schede personaggio»: migrazione 0011 applicata; vista pratica e classica, finestra sopra la mappa,
import da Roll20 e collegamento ai token in produzione, provati sul dominio pubblico. Restano il formato di VTT
Enhancement Suite e le prove con lettore di schermo.
Feature 005 «misura delle distanze» e 006 «griglia esagonale»: solo la specifica.
