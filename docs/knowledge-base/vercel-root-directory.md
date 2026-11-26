# I deploy di Vercel partiti da GitHub falliscono sempre

## Sintomo
Ogni push genera un deploy che fallisce in 2-3 secondi con `sh: line 1: vite: command not found` e
`Command "vite build" exited with 127`. Il controllo «Vercel» della pull request è rosso, eppure il sito pubblico
funziona.

## Causa radice
Il progetto Vercel aveva la Root Directory su `.` (la radice del repository), ma `package.json` e Vite stanno in
`app/`. Vercel non trovava niente da installare e quindi nemmeno il comando `vite`. Il sito funzionava solo perché
i deploy di produzione partivano dal terminale con `vercel --prod` dentro `app/`, che carica quella cartella come
radice.

## Come l'abbiamo confermata
- `vercel inspect <deploy> --logs` mostra l'errore subito dopo `Running "vercel build"`, senza alcuna installazione.
- `vercel project inspect dm-platform` mostrava `Root Directory .`.
- L'elenco dei deploy (`vercel api /v6/deployments?projectId=…`) mostra che ogni deploy con sorgente `git` è
  sempre fallito, dal primo, mentre quelli con sorgente `cli` erano `READY`.

## Risoluzione
Root Directory impostata su `app` con
`echo '{"rootDirectory":"app"}' | vercel api /v9/projects/<id> -X PATCH --input -`.
Da qui in poi i push su `master` vanno in produzione da soli e le PR hanno un'anteprima.
Il deploy dal terminale si lancia **dalla radice del repo** (`vercel --prod --yes`): da dentro `app/` Vercel
cercherebbe `app/app`.

## Lezione per il futuro
- Un controllo rosso «da sempre» non è rumore: va letto almeno una volta il log del build.
- In un monorepo con l'app in una sottocartella, la Root Directory si imposta alla creazione del progetto.
- Se un deploy dal terminale funziona e uno da Git no, la differenza è quasi sempre la cartella di partenza.

## Riferimenti
- PR #1 (controllo Vercel rosso), `specs/004-turni-iniziativa/tasks.md` (T020)
- https://vercel.com/docs/builds/configure-a-build#root-directory
