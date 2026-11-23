# DM Platform

Un tavolo virtuale per giocare di ruolo online: il DM carica una mappa e crea i token, i giocatori entrano
con un link d'invito e muovono i propri token, tutti in tempo reale.

**In produzione**: https://dm-platform-steel.vercel.app

## Stack

- React 18 + TypeScript + Vite (SPA, nessun server nostro)
- Supabase: Auth (email/password), Postgres con RLS, Storage (bucket privato `maps`), Realtime
- Mappa su canvas con `react-konva`; token salvati in celle e sincronizzati con Postgres Changes
- Deploy statico su Vercel (root `app/`)

## Avvio in locale

Servono Node 20 e un progetto Supabase (con "Confirm email" disattivato).

```bash
cd app
cp .env.example .env.local   # poi inserisci VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:5173
```

Lo schema si applica con `npx supabase link --project-ref <ref>` e `npx supabase db push --remote`
(migrazioni in `supabase/migrations/`, in ordine di numero).

Altri comandi: `npm test` (aggancio alla griglia e limiti mappa), `npm run build`.

## Documentazione

- Scenari di verifica: [`specs/001-tavolo-base/quickstart.md`](specs/001-tavolo-base/quickstart.md)
- Specifica, piano e task: cartella [`specs/001-tavolo-base/`](specs/001-tavolo-base/)
- Problemi risolti: [`docs/knowledge-base/`](docs/knowledge-base/)

## Stato

Feature 001 «tavolo base»: accesso con invito, mappa condivisa, token trascinabili e gestione membri
completati. Resta la verifica sul dominio pubblico.
