## D&D DM Platform – Monorepo

Piattaforma per la gestione di campagne D&D con backend (NestJS + Prisma + PostgreSQL + Socket.io), web client (HTML/CSS/JS) e mobile app (React Native + Expo).

- Radice repo: `dm-platform`
- Utenti target: DM e giocatori per campagne, combattimenti, personaggi, mostri, journal, inviti, chat/presenza realtime.

### Indice
- Backend (server): moduli, endpoints, realtime, env, comandi
- Web client: architettura, moduli, configurazione, troubleshooting
- Mobile: architettura, schermate, API, troubleshooting
- Servizi dati ed eventi realtime
- Bugfix principali, funzionalità attuali, roadmap

## Struttura del progetto
```
C:\Users\Christian\dm-platform
├─ server/                # Backend NestJS + Prisma + PostgreSQL + Socket.io
├─ web-client/            # Web client (HTML/CSS/JS vanilla)
├─ mobile/                # App mobile (React Native + Expo)
└─ README.md              # Questo file
```

## Requisiti
- Node.js LTS (>= 18)
- npm
- PostgreSQL (locale o container)

## Avvio rapido
- Backend:
  1) Configura `server/.env` (almeno `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`)
  2) Migrazioni Prisma: `cd server && npx prisma migrate dev`
  3) Avvio dev: `npm run start:dev`
  4) Base URL: `http://localhost:3000`
- Web client:
  1) `cd web-client && python -m http.server 5173`
  2) Apri `http://localhost:5173`
  3) Cache-busting attivo su `<script>` con query `?v=...`
- Mobile (Expo):
  1) `cd mobile && npm install`
  2) In `mobile/src/services/api.js` imposta `API_BASE_URL` con l’IP del PC: `http://<IP_PC>:3000`
  3) Avvia: `npx expo start` (usa Expo Go sul device nella stessa LAN)

---

## Backend (server)
- Framework: NestJS
- ORM: Prisma (PostgreSQL)
- Auth: JWT (header `Authorization: Bearer <token>`)
- Realtime: Socket.io (gateway Nest)

### Moduli principali e Endpoints
- Autenticazione (`auth`)
  - `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
  - Restituisce `access_token`; `/auth/me` per profilo corrente

- Campagne (`campaigns`)
  - CRUD campagne, membri, inviti
  - Owner auto-aggiunto come DM alla creazione (fix)
  - `GET /campaigns`, `POST /campaigns`, `DELETE /campaigns/:id`
  - Membri: `POST /campaigns/:id/members` (per email), `DELETE /campaigns/:id/members/:userId`
  - Ruoli: `PUT /campaigns/:id/members/:userId/role` (DM/Player)
  - Inviti: `POST /campaigns/:id/invitations`, `GET /campaigns/:id/invitations`, `POST /invitations/:token/accept`, `DELETE /campaigns/:id/invitations/:token`
  - Realtime: `campaign_created`, `campaign_deleted`, `campaign_members_updated`, `campaign_member_role_updated`, `campaign_member_removed`, `campaign_invitation_created`, `campaign_invitation_updated`

- Combattimento (`combat`)
  - CRUD combattimenti e partecipanti, turni, condizioni
  - Realtime: `combat_created`, `combat_deleted`, `combat_participant_added`, `combat_participant_updated`, `combat_participant_removed`, `combat_started`, `combat_turn_changed`, `combat_ended`
  - Nota: query partecipanti include `combat: { select: { campaignId: true } }`

- Personaggi (`characters`) e Mostri (`monsters`)
  - CRUD base; scheda 5e gestita soprattutto lato frontend

- Journal (`journal`)
  - CRUD note (contenuto rich HTML-lite) e immagini
  - Realtime: vedi “Realtime Journal” sotto

### Prisma (modelli principali)
`User`, `Campaign`, `CampaignMember`, `Character`, `JournalEntry`, `Invitation`, `Monster`, `Combat`, `CombatParticipant`

### Env (`server/.env`)
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `JWT_EXPIRES_IN=7d`

### Comandi utili
- `npm run start:dev` (watch)
- `npm run build`
- `npx prisma migrate dev`
- `npx prisma studio`

---

## Realtime (Socket.io)
- Connessione client: `io(BASE_URL)`
- Room per campagna: il client emette `join_campaign` con `campaignId`
- Eventi già emessi: campagne e combattimento (vedi sopra)

### Realtime Journal (richiesto/prossimo step)
- Server: emettere dopo CRUD
  - `journal_entry_created` `{ campaignId, entry }`
  - `journal_entry_updated` `{ campaignId, entry }`
  - `journal_entry_deleted` `{ campaignId, entryId }`
- Client (web/mobile): in stanza campagna, aggiornare lista/anteprima al volo

---

## Web Client (web-client)
- Stack: HTML, CSS, JS vanilla modulare
- `index.html`: top navigation bar, script con `?v=...`, include `socket.io.min.js` e `realtime.js`
- `styles/main.css`: nav top, modali più grandi, stili scheda 5e, tracker combattimento, editor Journal
- `js/config.js`: `API_BASE_URL='http://localhost:3000'` (senza `/api`)
- `js/api.js`:
  - REST client; rimosso auto-reload su 401; salvataggio `access_token`
  - `OPTIONS /auth/login` per health check; metodi inviti e update ruoli
- `js/auth.js`: stato auth e top nav
- `js/app.js`: bootstrap moduli, gestione inviti da hash, `openJournalCreate`
- `js/realtime.js`: socket condiviso, join campagna, chat/presenza
- Moduli:
  - `campaigns.js`: card, dettagli con membri/ruoli/inviti + realtime
  - `characters.js`: scheda 5e (stats, skill, HP/AC/Init/Speed, inventory, attacks, spells, notes, death saves)
  - `monsters.js`: CRUD con modale
  - `journal.js`: editor ricco (toolbar, immagini, drag&drop, anteprima, modale “Nuova nota”)

### Troubleshooting Web
- 401: fare login (token in `localStorage`)
- 404 `/api/...`: assicurarsi che `API_BASE_URL` non includa `/api`
- Cache: hard refresh o incrementare `?v=` in `index.html`

---

## Mobile App (mobile)
- Stack: React Native + Expo, React Navigation, Axios, AsyncStorage, Socket.io-client
- `App.js`: `MainStack` + tab (Campagne, Personaggi, Mostri, Journal) con `SafeAreaProvider`
- Schermate: `CampaignDetailsScreen`, `CombatTrackerScreen`, `CharactersScreen`, `CharacterDetailsScreen`, `JournalScreen`, `InventoryScreen`
- `src/services/api.js`: usare IP del PC per `API_BASE_URL`
- Realtime: join campagna e listener compatibili con il web

### Troubleshooting Mobile
- Backend non raggiungibile: usare IP del PC (no `localhost`); stessa LAN
- Errori 500: verificare log server; UI con messaggi chiari e fallback
- Tab Android: `tabBarStyle` alzata per non sovrapporsi ai tasti di sistema

---

## Servizi dati ed eventi (riassunto)
- Auth Service: registrazione, login, `me`; salva/legge `access_token`
- Campaigns Service: CRUD campagne, membri per email, ruoli DM/Player, inviti con token
- Characters Service: CRUD personaggi, valori scheda 5e
- Monsters Service: CRUD mostri
- Journal Service: CRUD note, immagini, anteprima live (drag & drop su web)
- Combat Service: CRUD combattimenti e partecipanti, iniziativa/turni/condizioni, log dadi (web)
- Realtime Gateway: eventi campagne, inviti, membri; eventi combattimento; (Journal in roadmap)

---

## Bugfix e cambiamenti chiave
- Fix 500 su lookup utente per email
- Owner auto-aggiunto come DM alla creazione campagna
- Rimosso `description` non presente nel modello Prisma
- Nuovi endpoint: update ruolo membro, revoke invito, `GET /auth/me`
- Realtime integrato per campagne e combattimento
- Web client: top nav, modali più grandi, editor Journal ricco, rimozione `as` TypeScript, fix loop 401, gestione `access_token`, cache-busting, `API_BASE_URL` senza `/api`
- Mobile: tab navigation, Combat Tracker base, migliorato error handling, `API_BASE_URL` su IP PC

---

## Funzionalità attuali
- Auth: register/login/me con JWT
- Campagne: CRUD, membri, ruoli DM/Player, inviti con token
- Personaggi: CRUD, scheda 5e avanzata (frontend)
- Mostri: CRUD
- Journal: editor ricco, upload/preview immagini, drag&drop
- Combattimento: partecipanti, iniziativa, turni, condizioni, log dadi (web)
- Realtime: campagne/membri/inviti, combattimento; chat/presenza base

---

## Roadmap / Lavori futuri
- Realtime Journal (server emit + listener web/mobile)
- Modali full-width per Combat e scheda 5e con header fisso
- Refinement Combat Tracker V2 (ordinamento, condizioni avanzate, azioni rapide)
- Gestione membri avanzata (permessi granulari)
- Migliorie UI/UX mobile (scheda 5e, Combat Tracker)
- Chat/presenza: typing indicator, storico, status
- Inviti: scadenza, ruoli predefiniti, deep link

---

## Troubleshooting generale
- 500/Prisma: controllare log server e schema/payload
- PowerShell: evitare `&&`; eseguire comandi separati
- Cache web: hard refresh o bump `?v=...`
- Token: frontend usa `access_token` salvato
- Mobile: usare IP PC (no `localhost`)

---

## Note di stile / Contributi
- Backend: coerenza Nest (controller/service/module), tipizzazione forte
- Web: JS modulare, evitare costrutti TypeScript in `.js`
- Mobile: componenti chiari, servizi API con gestione errori
- Nomi chiari, codice leggibile, niente commenti superflui

---

Progetto privato per uso interno/sperimentale. Aggiungere licenza se necessario.
