# Schermo bianco in locale: `.env.local` senza le variabili `VITE_`

## Sintomo
`npm run dev` parte senza errori nel terminale, ma la pagina è completamente bianca. Su Vercel la stessa app funziona.

## Causa radice
`app/.env.local` conteneva solo `VERCEL_OIDC_TOKEN` (probabilmente scritto da un comando Vercel). Mancavano
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, quindi `app/src/lib/supabase.ts` lancia un `Error` all'import
e React non monta nulla: l'errore compare solo nella console del browser.

## Come l'abbiamo confermata
`grep -oE '^[A-Za-z_]+=' app/.env.local` (stampa solo i nomi, mai i valori) ha mostrato l'unica chiave
`VERCEL_OIDC_TOKEN`. `vercel env ls` confermava che le due variabili `VITE_` esistono su Vercel (Production).

## Risoluzione
`npx vercel env pull .env.local --environment=production --yes` dentro `app/`, poi riavvio di `npm run dev`.
Il pull aggiunge anche `VERCEL_*` e crea `app/.gitignore` (`.env*`): non serve committarlo.

## Lezione per il futuro
- Schermo bianco in locale = prima controllare le variabili d'ambiente e la console del browser (F12).
- Verificare i file `.env` stampando solo i nomi delle chiavi.
- Un comando Vercel può sovrascrivere `.env.local`: dopo averlo lanciato controllare che le `VITE_` ci siano ancora.

- Un build senza le variabili `VITE_` riesce lo stesso ma produce un bundle falsamente piccolo (~49 KB gzip invece di ~194):
  non misurare le dimensioni con un `.env.local` incompleto.

## Riferimenti
- `app/src/lib/supabase.ts`
- `specs/001-tavolo-base/quickstart.md` (prerequisiti)
