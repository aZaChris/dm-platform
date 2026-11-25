# SPEC: «Stasera il sito si sveglia» (mix B → A → C di STORYLINES.md, con il giro del sito al centro)

GOAL:    chi guarda vede tutto il sito di DM Platform, pagina per pagina, immaginato vivo e ricco, e pensa
         «voglio giocarci». È un concept: un frontend che non esiste ancora, dichiarato con il cartellino «Concept».
         Le pagine, le sezioni e i testi sono quelli veri dell'app (etichette lette dal codice il 2026-11-25);
         l'animazione, i materiali e gli sfondi sono la parte immaginata.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    65 s x 30 = 1950 frame. Clock: la musica (catalogo HeyGen, ~90 bpm, 20 frame per beat; si riallinea ai
         beat reali con `npx hyperframes beats` quando c'è il brano).

LOOK:    medium: ottone e pergamena alla luce di candela; ogni pagina è un luogo del dungeon (sala, biblioteca,
         portale, mappa) con un suo sfondo generato, sempre nella stessa palette.
         ground: petrolio #0a1215 con nebbia generata (feTurbulence, 3 strati, opacità 0.18/0.12/0.08), grana 3%,
         vignettatura 18% (scrivania) / 10% (pagine).
         ink: avorio #ece6d6 per tutto ciò che si legge; muted #8a9ba0 per lo stato «dorme».
         accent oro #dcb468: la parola chiave di ogni titolo, l'onda del clic, il pulsante principale, il 20, il marchio.
         stato menta #8fd3b8: solo il sussurro e il turno (come nell'app).
         display: Cinzel 700, 96 px titoli di scena, 64 px titoli di pagina, tracking +2%;
         body: DM Sans 600, 32 px etichette, 28 px minimo per tutto ciò che si legge.
         luce: chiave calda dal basso a sinistra (candela, torce); ombre 0 18 40 rgba(0,0,0,.55).
OBJECTS: candela, scheda del personaggio, telefono con notifica, portatile (scrivania); finestra del browser con
         la barra dell'indirizzo; la landing di oggi (cattura reale di /presentazione/); pulsanti dell'app con le
         loro etichette; libri sullo scaffale (campagne); carte d'ottone (membri, iniziativa); d20 dorato
         sfaccettato; token (dischi colorati con iniziali); griglia della mappa; fumetti della chat; sigillo di
         ceralacca (invito); la mappa del sito disegnata come pianta di un dungeon.
MOTION:  enter = power3.out 18 f; move = power2.inOut 15 f; exit = power2.in 10 f; camera = expo.inOut 20 f con
         sfocatura di movimento 6 px; molla (token, carte) damping 0.5; stagger lettere 1 f, celle 1 f, carte 3 f.
         Ogni passaggio di pagina parte da un clic del cursore su un'etichetta vera (catena di oggetti).
         Fiamme, braci e nebbia: tween finiti calcolati dalla durata (nessun repeat -1), posizioni da PRNG con seme.

SHOTS:
  S1  0–120     Scrivania dall'alto a lume di candela; il telefono si accende: «Stasera alle 21 · La Cripta».
                Suono: vibrazione, ambiente. Passa: push nel portatile.
  S2  120–180   Push nello schermo (scala 1→7, expo.inOut 20 f, blur); lo schermo diventa il browser.
  S3  180–270   OGGI: la landing reale (cattura), ferma. Titolo «Funziona. Ma dorme» («dorme» in muted).
                Il cursore entra e si ferma su «Crea il tuo tavolo».
  S4  270–330   Clic: onda d'oro dal pulsante, la pagina si sveglia. Titolo «E se il sito prendesse vita?».
                Suono: clic, la musica si apre.
  S5  330–570   LANDING viva. Sfondo: mappa di dungeon generata in parallasse con nebbia; «Tavolo virtuale per
                giochi di ruolo» forgiato lettera per lettera in oro; le funzioni («Carica la mappa del tavolo»,
                «Sposta i token sulla griglia», «Invita i giocatori con un link») si srotolano come pergamene, una
                alla volta, ognuna con il suo disegno; il d20 della sezione «Dadi» gira. Clic su «Crea il tuo tavolo».
  S6  570–690   ACCEDI: la card è un cerchio di rune che si accende; email e password si scrivono con un tic leggero
                per lettera; clic su «Entra»: le rune si aprono come una porta di luce.
  S7  690–840   PANORAMICA «Bentornato al tavolo.» in una sala a lume di torce; «Ogni grande storia inizia con un
                tiro di dado.»; il «Diario delle attività» si scrive da solo come a penna d'oca; la card «La tua
                prossima avventura» mostra la mappa che respira. Clic su «Le tue campagne».
  S8  840–990   CAMPAGNE «La biblioteca delle avventure»: le campagne sono libri su uno scaffale; uno esce, «La Corona
                di Cenere», con il distintivo «Dungeon Master». Clic su «Apri tavolo →»: il libro si apre sulla mappa.
  S9  990–1350  TAVOLO: la mappa si disegna da sola con il «Pennello» (muri, porte, acqua); i token atterrano;
                4 verbi da ~90 f: tira (il d20 vola nella chat) · muovi (le celle si accendono sotto il token) ·
                sussurra (fumetto nel fumo menta, «privato per te») · iniziativa (le carte si ordinano 18 · 15 · 12,
                anello menta sul primo).
  S10 1350–1470 MEMBRI «Il party» · «Compagni di viaggio»: i membri sono stendardi con il ruolo («Dungeon Master»,
                «Giocatore»); «Invita un giocatore» diventa una pergamena chiusa da un sigillo di ceralacca.
  S11 1470–1590 PANORAMICA DEL SITO (payoff): la camera arretra e tutte le pagine visitate sono stanze di un'unica
                pianta di dungeon, unite da corridoi; una linea d'oro ripercorre il giro. Musica al massimo.
  S12 1590–1740 Finale C: al centro della pianta il d20 rotola, si ferma sull'1: crepa sul vetro (tonfo, 6 f di
                silenzio); rilancio, 20: esplosione di scintille.
  S13 1740–1830 «Ogni clic è un incantesimo» («incantesimo» in oro), tiene 2.5 s.
  S14 1830–1950 End card: le scintille disegnano il marchio, «DM Platform» entra con una tendina, sotto
                «Concept · il frontend che verrà» e dm-platform-steel.vercel.app. Tiene 2.5 s.

BANNED:  vuoto scuro con cose piccole al centro (ogni scena ha un luogo che riempie ≥40% del frame);
         bagliori e particelle senza causa (braci da candele e torce, scintille dal 20 e dai clic);
         gradienti viola o blu, card di vetro; tutto che entra sfumando dal basso (ogni pagina entra a modo suo:
         forgiata, srotolata, scritta, estratta, disegnata); titoli che si muovono dopo essere atterrati;
         tre card in fila; logo in un angolo; testi inventati (solo le etichette vere dell'app);
         spacciare il concept per l'app di oggi; «Introducing», «seamless», «unlock».
QA:      f0 (scrivania leggibile, non nero); f60 (notifica); f150 (push a metà); f240 (landing di oggi + titolo);
         f300 (onda d'oro); f420 (titolo forgiato); f520 (una pergamena srotolata leggibile); f640 (rune);
         f780 (panoramica, diario); f930 (libro estratto); f1080, f1170, f1260, f1330 (un verbo per frame);
         f1420 (stendardi); f1540 (pianta del sito con la linea d'oro); f1650 (crepa dell'1); f1700 (20);
         f1800 (claim); f1930 (marchio, nome, «Concept», URL).
