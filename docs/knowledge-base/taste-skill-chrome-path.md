# Il controllo finale di taste-skill non trova nessun browser

## Sintomo
Alla chiusura del turno l'hook `Stop` della skill stampa `GATE: ERROR`: `consistency.mjs` risponde
«No Chrome, Edge or Chromium found; set CHROME_PATH» e `check.mjs` «no Chrome found». La pagina resta non verificata.

## Causa radice
Sul computer non c'è Chrome di sistema; c'è solo il Chromium scaricato da Playwright in
`~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`. L'hook gira nel suo ambiente e non vede la variabile
`CHROME_PATH` che avevo impostato solo nel comando lanciato a mano.

## Come l'abbiamo confermata
`which google-chrome chromium chromium-browser` non trova nulla; `ls ~/.cache/ms-playwright` mostra il Chromium.
Lanciando `consistency.mjs` con `CHROME_PATH` impostato il browser veniva trovato, ma l'hook non ereditava la variabile.

## Risoluzione
Da fare una volta: esportare `CHROME_PATH` nell'ambiente in cui parte Claude Code (profilo della shell o `env` delle
impostazioni), così lo vedono anche gli hook. Nel frattempo il report dichiara «GATE: ERROR» e che la pagina non è
stata controllata dai test della skill.

**Fatto il 2026-11-25:** `CHROME_PATH` è nella chiave `env` di `~/.claude/settings.json`, che Claude Code passa
anche agli hook; da lì il gate ha girato davvero (24 → 7 → 1 FAIL in tre giri). Il percorso contiene la versione
(`chromium-1255`): dopo un aggiornamento di Playwright va corretto lì.

## Lezione per il futuro
- Una variabile impostata dentro un comando non arriva agli hook: va messa nell'ambiente del processo padre.
- Con `file://` una pagina con moduli JavaScript resta bianca: servirla con un server locale (`python3 -m http.server`).
- Per sapere quali file del kit usa una pagina, aprirla in un browser **pulito** e leggere il log del server: con la cache
  piena le richieste non compaiono.
- `pkill -f <testo>` può chiudere anche la shell che contiene quel testo nella riga di comando: usare `fuser -k <porta>/tcp`.

## Riferimenti
- `.claude/skills/design-taste-frontend/SKILL.md` (sezione 6, Check and look)
- `app/public/presentazione/index.html`
