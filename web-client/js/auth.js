// Authentication System for D&D Platform Web Client
class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    // Initialize authentication system
    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    // Check if user is already authenticated
    async checkAuthStatus() {
        const token = api.getAuthToken();
        
        if (token) {
            try {
                const response = await api.getCurrentUser();
                if (response.success) {
                    this.setCurrentUser(response.data);
                    this.showApp();
                } else {
                    this.clearAuth();
                    this.showAuth();
                }
            } catch (error) {
                console.warn('Auth check failed:', error);
                this.clearAuth();
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }

    // Bind authentication events
    bindEvents() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth form switching
        const showRegisterLink = document.getElementById('show-register');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => this.showRegisterForm(e));
        }

        const showLoginLink = document.getElementById('show-login');
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => this.showLoginForm(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!this.validateLoginForm(email, password)) {
            return;
        }

        try {
            this.showLoadingState('login-form');
            
            const response = await api.login(email, password);
            
            if (response.success) {
                this.setCurrentUser(response.data.user);
                this.showSuccessMessage(CONFIG.SUCCESS.LOGIN);
                this.showApp();
            } else {
                this.showErrorMessage(response.error || CONFIG.ERRORS.UNKNOWN_ERROR);
            }
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.hideLoadingState('login-form');
        }
    }

    // Handle register form submission
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;

        if (!this.validateRegisterForm(username, email, password)) {
            return;
        }

        try {
            this.showLoadingState('register-form');
            
            const response = await api.register(username, email, password);
            
            if (response.success) {
                this.showSuccessMessage(CONFIG.SUCCESS.REGISTER);
                this.showLoginForm();
                this.clearForm('register-form');
            } else {
                this.showErrorMessage(response.error || CONFIG.ERRORS.UNKNOWN_ERROR);
            }
        } catch (error) {
            this.showErrorMessage(error.message);
        } finally {
            this.hideLoadingState('register-form');
        }
    }

    // Handle logout
    async handleLogout(e) {
        e.preventDefault();
        
        try {
            await api.logout();
            this.clearAuth();
            this.showSuccessMessage(CONFIG.SUCCESS.LOGOUT);
            this.showAuth();
        } catch (error) {
            console.warn('Logout error:', error);
            // Continue with logout even if API call fails
            this.clearAuth();
            this.showAuth();
        }
    }

    // Form validation
    validateLoginForm(email, password) {
        if (!email) {
            this.showErrorMessage('Please enter your email');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showErrorMessage('Please enter a valid email address');
            return false;
        }
        
        if (!password) {
            this.showErrorMessage('Please enter your password');
            return false;
        }
        
        return true;
    }

    validateRegisterForm(username, email, password) {
        if (!username || username.length < CONFIG.VALIDATION.MIN_USERNAME_LENGTH) {
            this.showErrorMessage(`Username must be at least ${CONFIG.VALIDATION.MIN_USERNAME_LENGTH} characters long`);
            return false;
        }
        
        if (username.length > CONFIG.VALIDATION.MAX_USERNAME_LENGTH) {
            this.showErrorMessage(`Username must be no more than ${CONFIG.VALIDATION.MAX_USERNAME_LENGTH} characters long`);
            return false;
        }
        
        if (!email) {
            this.showErrorMessage('Please enter your email');
            return false;
        }
        
        if (!this.isValidEmail(email)) {
            this.showErrorMessage('Please enter a valid email address');
            return false;
        }
        
        if (!password || password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
            this.showErrorMessage(`Password must be at least ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`);
            return false;
        }
        
        return true;
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Set current user
    setCurrentUser(userData) {
        this.currentUser = userData;
        this.isAuthenticated = true;
        
        // Store user data in localStorage
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        
        // Update UI with user info
        this.updateUserInterface();
    }

    // Clear authentication
    clearAuth() {
        this.currentUser = null;
        this.isAuthenticated = false;
        api.setAuthToken(null);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }

    // Update user interface
    updateUserInterface() {
        const usernameElement = document.getElementById('username');
        if (usernameElement && this.currentUser) {
            usernameElement.textContent = this.currentUser.username || this.currentUser.email;
        }
    }

    // Show authentication forms
    showAuth() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    // Show main application
    showApp() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Initialize app components
        this.initializeApp();
    }

    // Initialize app after authentication
    initializeApp() {
        // Load initial data
        this.loadInitialData();
        
        // Set up navigation
        this.setupNavigation();
        
        // Load last visited section
        this.loadLastSection();
    }

    // Load initial app data
    async loadInitialData() {
        try {
            // Load campaigns, characters, etc.
            await Promise.all([
                this.loadCampaigns(),
                this.loadCharacters(),
                this.loadMonsters(),
                this.loadJournalEntries()
            ]);
        } catch (error) {
            console.warn('Failed to load initial data:', error);
        }
    }

    // Load campaigns
    async loadCampaigns() {
        try {
            const response = await api.getCampaigns();
            if (response.success) {
                this.renderCampaigns(response.data);
            }
        } catch (error) {
            console.warn('Failed to load campaigns:', error);
        }
    }

    // Load characters
    async loadCharacters() {
        try {
            const response = await api.getCharacters();
            if (response.success) {
                this.renderCharacters(response.data);
            }
        } catch (error) {
            console.warn('Failed to load characters:', error);
        }
    }

    // Load monsters
    async loadMonsters() {
        try {
            const response = await api.getMonsters();
            if (response.success) {
                this.renderMonsters(response.data);
            }
        } catch (error) {
            console.warn('Failed to load monsters:', error);
        }
    }

    // Load journal entries
    async loadJournalEntries() {
        try {
            const response = await api.getJournalEntries();
            if (response.success) {
                this.renderJournalEntries(response.data);
            }
        } catch (error) {
            console.warn('Failed to load journal entries:', error);
        }
    }

    // Setup navigation
    setupNavigation() {
        // Top navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Top navigation bar
        const topNavItems = document.querySelectorAll('.top-nav .nav-item');
        topNavItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    // Handle navigation
    handleNavigation(e) {
        const section = e.currentTarget.dataset.section;
        this.showSection(section);
        this.updateNavigation(section);
        this.saveLastSection(section);
    }

    // Show specific section
    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('current-section');
        if (breadcrumb) {
            breadcrumb.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        }
    }

    // Update navigation state
    updateNavigation(activeSection) {
        // Update top navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            }
        });
        
        // Update top navigation bar
        const topNavItems = document.querySelectorAll('.top-nav .nav-item');
        topNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            }
        });
    }

    // Save last visited section
    saveLastSection(section) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SECTION, section);
    }

    // Load last visited section
    loadLastSection() {
        const lastSection = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SECTION);
        if (lastSection) {
            this.showSection(lastSection);
            this.updateNavigation(lastSection);
        }
    }

    // Form switching
    showLoginForm(e) {
        if (e) e.preventDefault();
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    }

    showRegisterForm(e) {
        if (e) e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }

    // Loading states
    showLoadingState(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
    }

    hideLoadingState(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            if (formId === 'login-form') {
                submitBtn.innerHTML = 'Login';
            } else {
                submitBtn.innerHTML = 'Create Account';
            }
        }
    }

    // Clear form
    clearForm(formId) {
        const form = document.getElementById(formId);
        form.reset();
    }

    // Message display
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Render methods (to be implemented by other modules)
    renderCampaigns(campaigns) {
        // This will be implemented by the campaigns module
        console.log('Campaigns loaded:', campaigns);
    }

    renderCharacters(characters) {
        // This will be implemented by the characters module
        console.log('Characters loaded:', characters);
    }

    renderMonsters(monsters) {
        // This will be implemented by the monsters module
        console.log('Monsters loaded:', monsters);
    }

    renderJournalEntries(entries) {
        // This will be implemented by the journal module
        console.log('Journal entries loaded:', entries);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Check if user has permission
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    // Check if user is campaign owner
    isCampaignOwner(campaign) {
        return this.currentUser && campaign.ownerId === this.currentUser.id;
    }

    // Check if user is campaign member
    isCampaignMember(campaign) {
        if (!this.currentUser || !campaign.members) {
            return false;
        }
        return campaign.members.some(member => member.userId === this.currentUser.id);
    }
}

// Create global auth instance
const auth = new Auth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
} else {
    window.auth = auth;
}
