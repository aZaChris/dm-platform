# Quickstart: validare il Tavolo base

## Prerequisiti

- Node 20, un progetto Supabase cloud, un progetto Vercel (opzionale per la prova locale)
- Nel progetto Supabase: **Authentication → Providers → Email → "Confirm email" disattivato**
- `app/.env.local` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (la chiave *anon* è pubblica
  per progetto; i permessi li fa la RLS). Non committare il file.

## Setup

1. Applica lo schema: `npx supabase link --project-ref <ref>` poi `npx supabase db push --remote`
   (oppure incolla in ordine i file di `supabase/migrations/` nell'SQL editor).
2. `cd app && npm install && npm run dev`, apri l'URL indicato.
3. Controllo automatico: `npm test` (aggancio alla griglia e limiti mappa).

## Scenari (due browser: A normale, B finestra anonima)

| # | Passi | Esito atteso | Copre |
|---|---|---|---|
| 1 | A si registra, crea campagna "Prova" | A vede la campagna ed è DM | US1, SC-001 |
| 2 | A genera l'invito, B si registra e apre il link | B entra come Player in <1 min | US1, SC-002 |
| 3 | B riapre lo stesso link con un altro account | Rifiutato: invito usato | edge |
| 4 | A carica un'immagine mappa | B la vede comparire senza ricaricare | US2 |
| 5 | B prova a caricare/cambiare la mappa | Controllo assente; chiamata diretta rifiutata dalla RLS | FR-005, SC-005 |
| 6 | A crea token "Orco" (DM) e "Elfo" assegnato a B | Entrambi visibili a B | US3 |
| 7 | B trascina "Elfo" | Si aggancia alla cella; A lo vede in <1 s | FR-009/010, SC-003 |
| 8 | B trascina "Orco" | Non si muove; un update diretto è rifiutato | FR-008, SC-005 |
| 9 | B si disconnette, A sposta l'Elfo, B si riconnette | B vede la posizione aggiornata | FR-011 |
| 10 | A rimuove B | B perde l'accesso alla campagna subito | FR-013 |
| 11 | Carica un `.gif` o un file >5 MB | Rifiutato con messaggio chiaro | FR-012 |
| 12 | `npm run build` | JS gzip totale <500 KB | SC-006 |

Per i punti 5 e 8 serve provare anche la chiamata diretta (console del browser di B con
`supabase.from('tokens').update(...)`): se la RLS è corretta torna 0 righe modificate o un errore.

Misura reale (T025, rifatta con le variabili `VITE_` presenti): JS gzip **193,8 KB** (`index-*.js`, 657,8 KB non compresso), sotto i 500 KB.
Attenzione: senza `VITE_SUPABASE_*` il build dà ~49 KB gzip perché `supabase.ts` lancia sempre e il bundler elimina il resto: misura falsata.
