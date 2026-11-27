# Collaudo di stasera: istruzioni per l'agente

Leggi tutto prima di agire. Christian prova a mano; tu prepari, segui, registri gli esiti e correggi i bug.
Rispondi in italiano e spiega le scelte (Christian studia ciò che costruiamo).

## Stato (preparato il 2026-11-26)

| PR | Branch | Contenuto | Migrazione |
|---|---|---|---|
| #5 | `005-misura-distanze` | righello | `0012`, applicata |
| #6 | `006-griglia-esagonale` | griglia esagonale | `0013`, applicata |
| #7 | `009-recupero-password` | recupero password | nessuna |
| #8 (bozza) | `010-mappe-multiple` | mappe multiple | `0014`, **NON applicata** |

I branch sono in pila: ognuno contiene i precedenti. **Si prova tutto da `009-recupero-password`** (contiene 005, 006, 009).
Nessun branch è mai stato provato nel browser per la 006 e la 009. Per la 005 risultano già provati gli scenari
1, 3, 4, 6, 7 e 15 di `specs/005-misura-distanze/quickstart.md`.

## Regole

- Nessun merge, deploy o operazione distruttiva senza l'ok di Christian. **Un merge su `master` va in produzione.**
- **Non applicare `0014_scene.sql`** (attenzione: `db push` dal branch 010 la applicherebbe). Va applicata solo insieme
  al rilascio della 010.
- Non stampare i valori di `app/.env.local`; per controllarlo mostra solo i nomi delle variabili.
- Il repository è pubblico: niente email, password o dati dei giocatori nei file o nelle PR.

## Preparazione

1. `git fetch && git switch 009-recupero-password && git pull`
2. `cd app && npm install`
3. `app/.env.local` deve avere `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, altrimenti la pagina resta bianca
   (vedi `docs/knowledge-base/env-local-sovrascritto.md`).
4. `npm test` (atteso: tutto verde) e `npm run build`.
5. Christian, in Supabase → Authentication → URL Configuration, aggiunge agli indirizzi di ritorno
   `https://dm-platform-steel.vercel.app/` e `http://localhost:5173/`.
6. `npm run dev` (per il tablet: `npm run dev -- --host`; da WSL potrebbe non essere raggiungibile).
7. Due sessioni separate (DM e Player), una mappa a immagine, una mappa a celle, un account con email leggibile.

## Prove

**Esiti del 2026-11-27**: prove 6-22 eseguite in browser automatico (build di produzione di `009`, account di prova
`collaudo-dm-…` e `collaudo-pl-…@example.com`, campagne «Collaudo» e «Collaudo celle»). La 8 e la 11 fallivano:
corrette sul branch `005-misura-distanze` e riportate sopra con un merge. Restano 1-5 e 23.

Segna l'esito: ✅ passa, ❌ fallisce (con cosa si vede), ⏭ saltata (con il motivo).

### A. Accesso: recupero password (009)

| # | Passi | Risultato atteso | Esito |
|---|---|---|---|
| 1 | «Password dimenticata?» con un’email registrata | Messaggio neutro e arriva l’email  ⏭ serve un’email vera: da fare a mano |
| 2 | La stessa cosa con un’email non registrata | Stesso messaggio, nessuna email  ⏭ serve un’email vera: da fare a mano |
| 3 | Apri il link e salva una nuova password | Entri nell’app  ⏭ serve un’email vera: da fare a mano |
| 4 | Esci, prova la vecchia password, poi la nuova | La vecchia è rifiutata, la nuova entra  ⏭ serve un’email vera: da fare a mano |
| 5 | Riapri lo stesso link | «Il link non vale più», e puoi chiederne un altro  ⏭ serve un’email vera: da fare a mano |

### B. Righello su griglia quadrata (005)

| # | Passi | Risultato atteso | Esito |
|---|---|---|---|
| 6 | Misura 3 celle in diagonale e 2 in orizzontale | «5 celle · 25 ft · 7,5 m»  ✅ |
| 7 | Parti e arrivi nella stessa cella | «0 celle · 0 ft · 0 m»  ✅ |
| 8 | Trascina oltre il bordo della mappa | La misura si ferma sull’ultima cella  ✅ dopo correzione |
| 9 | DM e Player misurano insieme | Ognuno vede entrambe, con i nomi  ✅ |
| 10 | Il Player chiude la scheda del browser a metà misura | Al DM sparisce entro 3-4 secondi  ✅ |
| 11 | Solo tastiera: R, token scelto in «Scena», frecce, Esc | La misura parte dal token, segue le frecce, Esc la chiude  ✅ dopo correzione |

### C. Mappa a celle (005 e 006)

| # | Passi | Risultato atteso | Esito |
|---|---|---|---|
| 12 | Il DM, con «Modifica mappa» accesa, usa il righello | Non dipinge celle  ✅ |
| 13 | Il DM guarda la scelta «Griglia» nella scheda DM (serve anche un’immagine caricata) | Disabilitata, con la spiegazione  ✅ |

### D. Griglia esagonale su immagine (006)

| # | Passi | Risultato atteso | Esito |
|---|---|---|---|
| 14 | Apri una campagna mai toccata | La griglia è quadrata  ✅ |
| 15 | Il DM sceglie «Esagonale» | Il Player vede gli esagoni senza ricaricare  ✅ |
| 16 | Il Player cerca il menu «Griglia» | Non c’è  ✅ |
| 17 | Il Player lascia un token tra due esagoni | Va al più vicino, uguale per il DM  ✅ |
| 18 | Frecce nelle quattro direzioni, anche sul bordo | Un esagono vicino alla volta (su/giù a zig-zag); sul bordo resta fermo  ✅ |
| 19 | Righello tra esagoni vicini, poi lontani in tutte le direzioni | «1 esagono · 5 ft · 1,5 m», poi il numero di passi  ✅ |
| 20 | Avvia un combattimento e tira un dado | Anello del turno e tiri come prima  ✅ |
| 21 | Il DM carica un’altra immagine | La griglia resta esagonale  ✅ |
| 22 | Token nelle ultime righe, poi il DM torna a «Quadrata» | Tutti vedono i quadrati; il token resta dentro la mappa  ✅ |

### E. Tablet

| # | Passi | Risultato atteso | Esito |
|---|---|---|---|
| 23 | Col dito misura su quadrati ed esagoni | La pagina non scorre  ⏭ serve un tablet: da fare a mano |

## Se una prova fallisce

1. Riproducila e trova la causa prima di modificare.
2. Correggi nel branch della feature giusta (righello: 005; esagoni: 006; password: 009), poi riporta la correzione
   nei branch sopra con un merge, in ordine 005 → 006 → 009 → 010.
3. `npm test` e `npm run build`, poi chiedi a Christian prima di commit e push se non li ha già autorizzati.
4. Bug non banale: scrivi `docs/knowledge-base/<slug>.md` e aggiorna l'indice.

## Se tutto passa

1. Spunta i task in `specs/005…/tasks.md`, `006`, `009` e aggiorna «Stato» nel README.
2. Con l'ok di Christian: merge in ordine #5, #6, #7, controllando dopo ognuno il deploy.
3. Prove rapide sul dominio pubblico: un righello, il cambio di griglia, il recupero password.

## Dopo (solo se Christian vuole)

- **010**: applicare `0014_scene.sql` insieme al merge della #8; scenari in `specs/010-mappe-multiple/quickstart.md`
  (sul branch 010). Prima del merge la bozza va segnata «pronta».
- Prove arretrate di 004 (`specs/004-turni-iniziativa/quickstart.md`) e 007 (scenari 20-24).
- Idee non ancora specificate: nebbia di guerra, dadi per i danni, condizioni sui token, riposi, schede segrete del DM.
