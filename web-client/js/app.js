// Main Application Entry Point for D&D Platform Web Client
class App {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            console.log('🚀 Initializing D&D Platform Web Client...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showFatalError('Failed to initialize application');
        }
    }

    // Initialize app components
    async initializeApp() {
        try {
            // Check if backend is available
            await this.checkBackendHealth();
            
            // Initialize UI system
            this.initializeUI();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set up global event listeners
            this.setupGlobalEvents();

            // Handle invite token in URL hash
            this.handleInviteFromHash();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ D&D Platform Web Client initialized successfully!');
            
            // Hide loading screen after a short delay for better UX
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize app components:', error);
            this.showFatalError('Failed to initialize application components');
        }
    }

    // Check backend health
    async checkBackendHealth() {
        try {
            const isHealthy = await api.healthCheck();
            if (!isHealthy) {
                throw new Error('Backend is not responding');
            }
            console.log('✅ Backend connection established');
        } catch (error) {
            console.warn('⚠️ Backend health check failed:', error);
            // Continue anyway - user might be offline or backend might be starting up
        }
    }

    // Initialize UI system
    initializeUI() {
        // Add notification styles to head
        this.addNotificationStyles();
        
        // Initialize responsive design
        this.initializeResponsive();
        
        console.log('✅ UI system initialized');
    }

    // Initialize all modules
    async initializeModules() {
        try {
            // Initialize campaigns module
            if (typeof CampaignsModule !== 'undefined') {
                this.modules.campaigns = new CampaignsModule();
                console.log('✅ Campaigns module initialized');
            }
            
            // Initialize characters module
            if (typeof CharactersModule !== 'undefined') {
                this.modules.characters = new CharactersModule();
                console.log('✅ Characters module initialized');
            }
            
            // Initialize monsters module
            if (typeof MonstersModule !== 'undefined') {
                this.modules.monsters = new MonstersModule();
                console.log('✅ Monsters module initialized');
            }
            
            // Initialize journal module
            if (typeof Journal !== 'undefined') {
                this.modules.journal = new Journal();
                console.log('✅ Journal module initialized');
            }
            
            // Initialize UI module
            if (typeof UIModule !== 'undefined') {
                this.modules.ui = new UIModule();
                console.log('✅ UI module initialized');
            }

            // Ensure journal exposes openCreate for New Entry button/testing
            try {
                if (this.modules.journal && typeof this.modules.journal.openCreate !== 'function') {
                    if (window.JournalInstance && typeof window.JournalInstance.showNewEntryForm === 'function') {
                        this.modules.journal.openCreate = () => window.JournalInstance.showNewEntryForm();
                    }
                }
            } catch (_) {}

            // Wire New Entry button to journal create regardless of implementation
            try {
                // Global helper for debugging and direct access
                window.openJournalCreate = () => {
                    const jm = this.modules.journal;
                    if (jm && typeof jm.openCreate === 'function') {
                        jm.openCreate();
                        return true;
                    }
                    if (window.JournalInstance && typeof window.JournalInstance.showNewEntryForm === 'function') {
                        window.JournalInstance.showNewEntryForm();
                        return true;
                    }
                    // Fallback lightweight modal
                    try {
                        const html = `
                          <div style="position:relative;padding:24px;max-width:520px">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                              <h3 style="margin:0">New Entry</h3>
                              <button class="btn btn-outline modal-close">Close</button>
                            </div>
                            <label>Title</label>
                            <input id="fb-j-title" type="text" style="width:100%;margin:8px 0;padding:10px;border:1px solid #e1e5e9;border-radius:10px" />
                            <label>Content</label>
                            <textarea id="fb-j-content" rows="8" style="width:100%;margin:8px 0;padding:10px;border:1px solid #e1e5e9;border-radius:10px"></textarea>
                            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
                              <button class="btn btn-outline modal-close">Cancel</button>
                              <button class="btn btn-primary" id="fb-j-save">Save</button>
                            </div>
                          </div>`;
                        this.modules.ui?.showModal(html);
                        const saveBtn = document.getElementById('fb-j-save');
                        saveBtn?.addEventListener('click', async ()=>{
                            const titleEl = document.getElementById('fb-j-title');
                            const contentEl = document.getElementById('fb-j-content');
                            const title = titleEl && 'value' in titleEl ? String(titleEl.value).trim() : '';
                            const content = contentEl && 'value' in contentEl ? String(contentEl.value) : '';
                            if (!title) { this.showMessage('Title is required','error'); return; }
                            try {
                                const res = await api.createJournalEntry({ title, content });
                                if (!res || res.success === false) throw new Error(res && res.error || 'Create failed');
                                this.modules.ui?.hideModal();
                                this.modules.journal && typeof this.modules.journal.refresh==='function' && this.modules.journal.refresh();
                                this.showMessage('Entry created','success');
                            } catch (err) { this.showMessage(err.message||'Failed to create entry','error'); }
                        });
                        return true;
                    } catch (e) {
                        console.warn('CREATE NOT AVAILABLE');
                    }
                    return false;
                };

                const newEntryBtn = document.getElementById('newEntryBtn');
                if (newEntryBtn) {
                    newEntryBtn.onclick = (e) => { e.preventDefault(); window.openJournalCreate(); };
                }
                // Retry wiring shortly after in case DOM/UI re-renders
                setTimeout(() => {
                    const btn = document.getElementById('newEntryBtn');
                    if (btn && (!btn.onclick || String(btn.onclick).includes('console.log'))) {
                        btn.onclick = (e) => { e.preventDefault(); window.openJournalCreate(); };
                    }
                }, 500);
            } catch (_) {}
            
        } catch (error) {
            console.warn('⚠️ Some modules failed to initialize:', error);
        }
    }

    // Setup global event listeners
    setupGlobalEvents() {
        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });
        
        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        console.log('✅ Global event listeners setup complete');
    }

    async handleInviteFromHash() {
        try {
            const hash = window.location.hash || '';
            const m = hash.match(/invite=([A-Za-z0-9_-]+)/);
            if (!m) return;
            const token = m[1];
            this.renderInviteBanner(token);
        } catch (e) {
            this.showMessage(e.message || 'Impossibile accettare invito', 'error');
        }
    }

    renderInviteBanner(token) {
        // Remove existing banner if any
        const existing = document.getElementById('invite-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'invite-banner';
        banner.style.cssText = 'position:sticky;top:0;z-index:200;background:#e0f2fe;color:#075985;border-bottom:1px solid #bae6fd;padding:10px 16px;display:flex;align-items:center;gap:12px;justify-content:center';
        banner.innerHTML = `
            <span>Hai ricevuto un invito a una campagna.</span>
            <button id="invite-accept" class="btn btn-primary">Accetta</button>
            <button id="invite-decline" class="btn btn-outline">Ignora</button>
        `;
        // Insert after header if present, else at top of body
        const header = document.querySelector('.app-header');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            document.body.prepend(banner);
        }

        const clearHash = () => history.replaceState(null, document.title, window.location.pathname + window.location.search);

        document.getElementById('invite-accept')?.addEventListener('click', async () => {
            try {
                const res = await api.acceptInvitation(token);
                if (res && res.success) {
                    this.showMessage('Invito accettato! Ora puoi vedere la campagna.', 'success');
                    banner.remove();
                    clearHash();
                    this.modules.campaigns?.refresh();
                }
            } catch (e) { this.showMessage(e.message || 'Impossibile accettare invito', 'error'); }
        });

        document.getElementById('invite-decline')?.addEventListener('click', () => {
            banner.remove();
            clearHash();
            this.showMessage('Invito ignorato', 'info');
        });
    }

    // Add notification styles
    addNotificationStyles() {
        const styles = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 16px 20px;
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 400px;
                border-left: 4px solid #667eea;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                border-left-color: #28a745;
            }
            
            .notification-error {
                border-left-color: #dc3545;
            }
            
            .notification-info {
                border-left-color: #17a2b8;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-content i {
                font-size: 18px;
            }
            
            .notification-success i {
                color: #28a745;
            }
            
            .notification-error i {
                color: #dc3545;
            }
            
            .notification-info i {
                color: #17a2b8;
            }
            
            .notification-content span {
                color: #333;
                font-weight: 500;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Initialize responsive design
    initializeResponsive() {
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewport);
        }
        
        // Add CSS custom properties for breakpoints
        const root = document.documentElement;
        Object.entries(CONFIG.BREAKPOINTS).forEach(([name, value]) => {
            root.style.setProperty(`--breakpoint-${name.toLowerCase()}`, `${value}px`);
        });
    }

    // Handle window resize
    handleResize() {
        const width = window.innerWidth;
        
        // Update CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--viewport-width', `${width}px`);
        
        // Trigger resize events for modules
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.handleResize === 'function') {
                module.handleResize(width);
            }
        });
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden - pause real-time updates
            this.pauseRealtimeUpdates();
        } else {
            // Tab is visible - resume real-time updates
            this.resumeRealtimeUpdates();
        }
    }

    // Handle online/offline status
    handleOnlineStatus(isOnline) {
        if (isOnline) {
            console.log('🌐 Back online - reconnecting...');
            this.showMessage('Connection restored', 'success');
            this.reconnect();
        } else {
            console.log('📡 Connection lost');
            this.showMessage('Connection lost - working offline', 'warning');
        }
    }

    // Handle before unload
    handleBeforeUnload(e) {
        // Save any unsaved changes
        this.saveUnsavedChanges();
        
        // Show confirmation if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Ctrl/Cmd + N for new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewItem();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    // Pause real-time updates
    pauseRealtimeUpdates() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.pauseRealtime === 'function') {
                module.pauseRealtime();
            }
        });
    }

    // Resume real-time updates
    resumeRealtimeUpdates() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.resumeRealtime === 'function') {
                module.resumeRealtime();
            }
        });
    }

    // Reconnect to backend
    async reconnect() {
        try {
            await api.healthCheck();
            this.showMessage('Reconnected successfully', 'success');
            
            // Refresh data
            this.refreshData();
        } catch (error) {
            console.warn('Reconnection failed:', error);
        }
    }

    // Save unsaved changes
    saveUnsavedChanges() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.saveUnsavedChanges === 'function') {
                module.saveUnsavedChanges();
            }
        });
    }

    // Check if there are unsaved changes
    hasUnsavedChanges() {
        return Object.values(this.modules).some(module => {
            return module && typeof module.hasUnsavedChanges === 'function' && module.hasUnsavedChanges();
        });
    }

    // Focus search
    focusSearch() {
        const searchInput = document.querySelector('input[type="search"], .search-bar input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Create new item
    createNewItem() {
        // Get current section
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            const sectionId = activeSection.id;
            const createBtn = activeSection.querySelector('button[id*="create"]');
            if (createBtn) {
                createBtn.click();
            }
        }
    }

    // Close modals
    closeModals() {
        const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.click();
            }
        });
    }

    // Refresh data
    async refreshData() {
        try {
            // Refresh all modules
            Object.values(this.modules).forEach(module => {
                if (module && typeof module.refresh === 'function') {
                    module.refresh();
                }
            });
        } catch (error) {
            console.warn('Failed to refresh data:', error);
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 300);
        }
    }

    // Show message (toast notification)
    showMessage(message, type = 'info') {
        try {
            const containerId = 'notify-container';
            let container = document.getElementById(containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                container.style.position = 'fixed';
                container.style.top = '20px';
                container.style.right = '20px';
                container.style.zIndex = '10001';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '10px';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            const cls = type === 'success' ? 'notification-success' : type === 'error' ? 'notification-error' : 'notification-info';
            toast.className = `notification ${cls}`;
            toast.innerHTML = `
                <div class="notification-content">
                    <i class="${type==='success'?'fas fa-check-circle': type==='error'?'fas fa-times-circle':'fas fa-info-circle'}"></i>
                    <span>${String(message)}</span>
                </div>
            `;
            container.appendChild(toast);
            // trigger animation
            requestAnimationFrame(()=> toast.classList.add('show'));
            // auto-hide
            setTimeout(()=>{
                toast.classList.remove('show');
                setTimeout(()=> toast.remove(), 300);
            }, 3000);
        } catch (_) {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Show fatal error
    showFatalError(message) {
        const errorHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #dc3545;
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="font-size: 2rem; margin-bottom: 20px;">🚨 Fatal Error</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 20px;">${message}</p>
                    <button onclick="window.location.reload()" style="
                        background: white;
                        color: #dc3545;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 1rem;
                        cursor: pointer;
                    ">Reload Page</button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }

    // Utility: Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Get module
    getModule(name) {
        return this.modules[name];
    }

    // Check if module is loaded
    isModuleLoaded(name) {
        return this.modules[name] !== undefined;
    }

    // Get app status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            online: navigator.onLine,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        };
    }
}

// Create global app instance
const app = new App();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.app = app;
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (app && typeof app.showFatalError === 'function') {
        app.showFatalError('An unexpected error occurred');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (app && typeof app.showFatalError === 'function') {
        app.showFatalError('An unexpected error occurred');
    }
});

console.log('🎮 D&D Platform Web Client loaded successfully!');
