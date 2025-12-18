# 🌐 D&D Platform - Web Client

Un client web moderno e responsive per la piattaforma D&D, progettato per funzionare su desktop e dispositivi mobili.

## ✨ Caratteristiche

- **🎨 Design Moderno**: Interfaccia pulita e intuitiva con tema D&D
- **📱 Responsive**: Ottimizzato per desktop, tablet e mobile
- **🔐 Autenticazione Completa**: Login, registrazione e gestione sessione
- **🏰 Gestione Campagne**: Creazione, modifica e gestione campagne
- **👤 Character Sheets**: Gestione completa dei personaggi
- **👹 Monster Library**: Libreria mostri con ricerca e filtri
- **📖 Journal System**: Sistema diario per campagne
- **⚡ Realtime**: Aggiornamenti in tempo reale per chat e combat
- **🎲 Dice Rolling**: Sistema di tiri di dado integrato
- **📁 File Upload**: Supporto per immagini e documenti
- **⌨️ Shortcuts**: Scorciatoie da tastiera per power users

## 🚀 Installazione

### Prerequisiti

- Backend D&D Platform in esecuzione su `http://localhost:3000`
- Browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione internet per font e icone

### Setup Rapido

1. **Clona il repository**:
   ```bash
   git clone <repository-url>
   cd web-client
   ```

2. **Avvia il backend** (se non è già in esecuzione):
   ```bash
   cd ../backend
   npm start
   ```

3. **Apri il web client**:
   - Apri `index.html` nel browser
   - Oppure avvia un server locale:
     ```bash
     # Con Python 3
     python -m http.server 8000
     
     # Con Node.js
     npx serve .
     
     # Con PHP
     php -S localhost:8000
     ```

4. **Accedi all'app**:
   - Apri `http://localhost:8000` nel browser
   - Registra un nuovo account o accedi

## 🏗️ Struttura del Progetto

```
web-client/
├── index.html              # Pagina principale
├── styles/
│   └── main.css           # Stili CSS principali
├── js/
│   ├── config.js          # Configurazione app
│   ├── api.js             # Client API
│   ├── auth.js            # Sistema autenticazione
│   ├── app.js             # App principale
│   ├── campaigns.js       # Modulo campagne
│   ├── characters.js      # Modulo personaggi
│   ├── monsters.js        # Modulo mostri
│   ├── journal.js         # Modulo diario
│   └── ui.js              # Modulo UI
└── README.md              # Questo file
```

## 🎯 Moduli Principali

### 🔐 Autenticazione (`auth.js`)
- Login e registrazione utenti
- Gestione token JWT
- Controllo permessi e ruoli
- Gestione sessione

### 🏰 Campagne (`campaigns.js`)
- Creazione e gestione campagne
- Inviti e gestione membri
- Chat in tempo reale
- Combat tracker

### 👤 Personaggi (`characters.js`)
- Character sheets complete
- Gestione statistiche D&D 5e
- Inventory management
- Level progression

### 👹 Mostri (`monsters.js`)
- Libreria mostri
- Ricerca e filtri avanzati
- Statistiche complete
- Encounter builder

### 📖 Diario (`journal.js`)
- Entrate diario campagne
- Editor ricco di testo
- Tags e categorizzazione
- Timeline eventi

## 🎨 Personalizzazione

### Temi e Colori

I colori principali sono definiti in `config.js`:

```javascript
COLORS: {
    PRIMARY: '#667eea',      // Blu principale
    SECONDARY: '#764ba2',    // Viola secondario
    SUCCESS: '#28a745',      // Verde successo
    WARNING: '#ffc107',      // Giallo warning
    DANGER: '#dc3545',       // Rosso errore
}
```

### Breakpoints Responsive

```javascript
BREAKPOINTS: {
    MOBILE: 480,        // Mobile
    TABLET: 768,        // Tablet
    DESKTOP: 1024,      // Desktop
    LARGE_DESKTOP: 1200 // Large desktop
}
```

## ⌨️ Scorciatoie da Tastiera

- **Ctrl/Cmd + K**: Focus su barra di ricerca
- **Ctrl/Cmd + N**: Crea nuovo elemento
- **Escape**: Chiudi modali
- **F5**: Ricarica pagina
- **Ctrl/Cmd + R**: Ricarica dati

## 🔧 Configurazione

### Backend URL

Modifica `config.js` per cambiare l'URL del backend:

```javascript
API_BASE_URL: 'http://localhost:3000/api',
WS_URL: 'ws://localhost:3000',
```

### Feature Flags

Abilita/disabilita funzionalità:

```javascript
FEATURES: {
    REALTIME_CHAT: true,      // Chat in tempo reale
    REALTIME_COMBAT: true,    // Combat tracker realtime
    FILE_UPLOADS: true,       // Upload file
    DICE_ROLLING: true,       // Sistema dadi
    VOICE_CHAT: false,        // Chat vocale (futuro)
}
```

## 📱 Browser Supportati

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+

## 🚨 Troubleshooting

### Problemi Comuni

1. **Backend non raggiungibile**:
   - Verifica che il backend sia in esecuzione
   - Controlla la console per errori di rete
   - Verifica l'URL in `config.js`

2. **Problemi di autenticazione**:
   - Cancella localStorage del browser
   - Verifica che il token JWT sia valido
   - Ricarica la pagina

3. **Stili non caricati**:
   - Verifica che `main.css` sia accessibile
   - Controlla la console per errori CSS
   - Verifica che i font Google siano caricati

4. **Funzionalità realtime non funzionanti**:
   - Verifica la connessione WebSocket
   - Controlla che il backend supporti WebSocket
   - Verifica i log del backend

### Debug Mode

Abilita il debug nella console:

```javascript
// In config.js
DEBUG: true,
LOG_LEVEL: 'debug'
```

## 🔮 Roadmap

### Prossime Funzionalità

- [ ] **Voice Chat**: Chat vocale integrata
- [ ] **3D Maps**: Mappe 3D interattive
- [ ] **AI Dungeon Master**: Assistente AI per DM
- [ ] **Mobile App**: App nativa React Native
- [ ] **Offline Mode**: Funzionalità offline
- [ ] **Multi-language**: Supporto multilingua
- [ ] **Themes**: Temi personalizzabili
- [ ] **Plugins**: Sistema plugin estendibile

### Miglioramenti Tecnici

- [ ] **PWA**: Progressive Web App
- [ ] **Service Workers**: Caching avanzato
- [ ] **WebAssembly**: Performance migliorate
- [ ] **WebGL**: Rendering grafico avanzato
- [ ] **WebRTC**: Comunicazione peer-to-peer

## 🤝 Contribuire

1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Standard di Codice

- **JavaScript**: ES6+ con arrow functions
- **CSS**: BEM methodology
- **HTML**: Semantic HTML5
- **Comments**: JSDoc per funzioni pubbliche

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi `LICENSE` per dettagli.

## 🆘 Supporto

- **Issues**: [GitHub Issues](link-to-issues)
- **Discord**: [Server Discord](link-to-discord)
- **Email**: support@ddplatform.com
- **Documentazione**: [Wiki](link-to-wiki)

## 🙏 Ringraziamenti

- **D&D 5e**: Wizards of the Coast per il sistema di gioco
- **Font Awesome**: Per le icone
- **Google Fonts**: Per i font Inter
- **Community**: Tutti i contributori e tester

---

**Buon divertimento con le tue avventure D&D! 🐉⚔️✨**
