# DESIGN.md — DM Platform

Design system del tavolo virtuale. Fonte di verità per colori, tipografia, movimento e componenti:
i token vivono in `app/src/index.css` e i componenti li usano **solo** tramite variabili (`var(--…)`).
Riferimento visivo: la bozza «dndBrowser» fatta in Canva AI (petrolio scuro, oro, titoli in maiuscoletto).

## 1. Atmosfera
Una taverna di sera: fondo petrolio quasi nero, luce calda dell'oro che accende solo ciò che è importante.
Sobrio e leggibile con la mappa al centro; il «fantasy» sta nella tipografia e nel movimento, non nelle cornici.
Mai più di un elemento d'oro per area: l'oro è un invito all'azione, non una decorazione.

## 2. Colori e ruoli
| Token | Valore | Ruolo |
|---|---|---|
| `--bg` | `#0a1215` | sfondo pagina |
| `--bg-side` | `#0d1a1f` | barra laterale, pannelli profondi |
| `--surface` | `#122127` | card, pannelli |
| `--surface-2` | `#183038` | elementi attivi, hover |
| `--line` | `#26373d` | bordi (1px) |
| `--text` | `#ece6d6` | testo principale (avorio) |
| `--muted` | `#8a9ba0` | testo secondario |
| `--gold` | `#dcb468` | azione primaria, titoli di sezione piccoli |
| `--gold-ink` | `#1a1408` | testo su fondo oro |
| `--mint` | `#8fd3b8` | stato attivo, badge «DM» |
| `--danger` | `#e0705f` | errori, azioni distruttive |
| `--crit` | `#f2c94c` | 20 naturale |
| `--fail` | `#b5483a` | 1 naturale |

I valori sono stimati a occhio dalla bozza: si ritoccano qui, in un punto solo.
Contrasto: testo su `--surface` ≥ 7:1; `--muted` solo per testo secondario ≥ 14px.

## 3. Tipografia
- **Titoli**: Cinzel (serif), maiuscoletto, spaziatura +0.02em. Pesi 500–600.
- **Corpo e UI**: DM Sans, 15px/1.5. Pulsanti 600.
- **Etichette piccole** (occhielli): DM Sans 11px, maiuscole, spaziatura +0.18em, colore `--gold`.
- Scala: 11 · 13 · 15 · 20 · 28 · 44 px. Niente altre misure.

## 4. Componenti
- **Card**: sfumatura da `--surface` leggermente più chiara in alto, bordo `--line`, raggio 14px, padding 20px.
  Al passaggio un alone oro tenue segue il puntatore (`--mx/--my`, un solo ascoltatore in `main.tsx`); le card cliccabili salgono di 2-3px.
- **Card campagna**: copertina a griglia da mappa, colorata con una tonalità ricavata dal nome (sempre la stessa per campagna).
- **Pulsante primario**: fondo `--gold` (sfumato), testo `--gold-ink`, raggio 8px; al passaggio un riflesso lo attraversa, al clic si schiaccia (scala .97). **Secondario**: trasparente con bordo `--line`.
- **Input**: fondo `--bg-side`, bordo `--line`, focus con anello `--gold` (mai rimuovere il focus).
- **Badge**: pillola con bordo; DM in `--mint`, Giocatore in `--muted`.
- **Token sulla mappa**: cerchio colorato con iniziali, bordo bianco 2px, ombra morbida.

## 5. Layout
Barra laterale 240px + contenuto fluido; griglia a 12 colonne, spazi multipli di 4px (8 · 16 · 24 · 40).
Sotto 800px la barra diventa una riga in alto. La mappa occupa sempre tutta la larghezza disponibile.
**Tavolo**: mappa a sinistra, a destra un solo pannello fisso a schede (Scena · Chat · Combattimento · DM) con i dadi
sempre in fondo. Pallino oro sulla scheda Chat se arriva qualcosa mentre guardi altro, menta su Combattimento se c'è un turno in corso.
**Accesso**: schermo diviso, foto del tavolo a sinistra e modulo a destra (sotto 900px la foto va in alto).

## 6. Profondità
Niente ombre pesanti: livelli dati da colore (`--bg` → `--surface` → `--surface-2`) e bordo.
Ombra solo per ciò che galleggia (menu, finestra dadi): `0 12px 40px rgb(0 0 0 / .45)`.

## 7. Movimento
Il movimento guida l'attenzione, non decora. Tutto passa da `prefers-reduced-motion`.
| Cosa | Come | Durata |
|---|---|---|
| Entrata pagina | dissolvenza + salita di 8px, elementi a cascata | 450ms, ritardo 60ms |
| Hover card/pulsante | salita 2px + bordo oro | 180ms |
| Sfondo | bagliore radiale che respira lentamente (CSS) | 18s, infinito |
| Cambio pagina | View Transitions API: il vecchio contenuto si dissolve, il nuovo sale; la barra resta ferma | 180 + 320ms |
| Token sulla mappa | scivola nella nuova cella (tween di Konva), anche quando lo muove un altro | 350ms |
| Turno attivo | anello menta tratteggiato che ruota; riga dell'iniziativa che «respira» | continuo |
| Messaggi chat, righe del diario | entrano scivolando da sinistra | 300-350ms |
| Lancio dadi | vedi §10 | 1.4s |

**Movimento d'ambiente** (eccezione al limite dei 600ms, solo decorazione e mai su ciò che si legge):
foto delle hero che si avvicina piano (24s), braci che salgono (`Embers.tsx`, 8-13s), grana fissa sopra la pagina.
Curva standard: `cubic-bezier(.2, .8, .2, 1)`.

## 8. Responsive
Mobile-first sotto 800px: una colonna, pulsanti a tutta larghezza, area di tocco ≥ 44px.
Il canvas della mappa si adatta al contenitore; il trascinamento funziona anche al tocco.

## 9. Regole per l'agente
**Fai**: usa solo i token; un solo pulsante oro per schermata; titoli in Cinzel, tutto il resto DM Sans;
stati di focus sempre visibili; testo in italiano.
**Non fare**: colori in esadecimale dentro i componenti, nuove librerie UI, animazioni sopra 600ms
(tranne i dadi e il movimento d'ambiente di §7), cornici decorative, testo `--muted` su sfondi chiari.
Prima di chiudere un lavoro sull'interfaccia: `npm run build`, poi uno screenshot a 1440px e uno a 390px.

## 10. Lancio dei dadi (stile Baldur's Gate 3)
Un d20 grande al centro dello schermo su velo scuro, non un pannello laterale.
1. **Annuncio**: in alto la prova richiesta («Prova di Percezione · CD 15»), in maiuscoletto.
2. **Lancio**: il dado ruota e rimbalza (≈1s), con alone oro che pulsa.
3. **Esito**: il numero si ferma al centro; sotto, bonus e totale («14 + 3 = 17»).
4. **Verdetto**: «Successo» in `--mint` o «Fallimento» in `--danger`; 20 naturale con scintille `--crit`,
   1 naturale con tremolio e tinta `--fail`.
5. Il risultato resta 2s, poi la finestra si dissolve e l'esito compare nel diario del tavolo, visibile a tutti.
Il numero lo decide il server (funzione SQL), non il browser, così nessuno può truccare un tiro.
