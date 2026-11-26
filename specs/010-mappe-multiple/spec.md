# Feature Specification: Mappe multiple e scene

**Feature Branch**: `010-mappe-multiple` | **Created**: 2026-11-26 | **Status**: Draft

## User Stories

1. **(P1) Preparare**: il DM aggiunge scene, ognuna con la sua mappa (immagine o celle), griglia e token, senza che i
   giocatori le vedano.
2. **(P1) Mettere in gioco**: il DM sceglie quale scena è in gioco; tutti la vedono senza ricaricare e i token dei
   giocatori li seguono.
3. **(P2) Spostare e togliere**: il DM porta nella scena un token di un'altra ed elimina le scene che non servono.

## Requirements

- **FR-001**: Ogni campagna MUST avere almeno una scena, e una sola in gioco; quelle esistenti diventano «Scena 1».
- **FR-002**: Mappa, griglia e token MUST appartenere a una scena.
- **FR-003**: Un Player MUST vedere solo la scena in gioco, anche con richieste dirette (righe, token, immagine).
- **FR-004**: Solo il DM MUST poter creare, modificare, mettere in gioco ed eliminare scene.
- **FR-005**: Al cambio di scena i token con un proprietario MUST seguire, mantenendo la scheda collegata.
- **FR-006**: Con un combattimento in corso il cambio di scena MUST essere rifiutato con un messaggio.
- **FR-007**: La scena in gioco MUST NOT essere eliminabile; eliminarne un'altra elimina i suoi token.

## Assumptions

- Confermate da Christian il 2026-11-26: ogni scena ha i suoi token; i giocatori vedono solo quella in gioco.
- Rinominare e riordinare le scene è rimandato.
