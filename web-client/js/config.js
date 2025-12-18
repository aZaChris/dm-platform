// Configuration for D&D Platform Web Client
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://localhost:3000',
    
    // WebSocket Configuration (for real-time features)
    WS_URL: 'ws://localhost:3000',
    
    // App Configuration
    APP_NAME: 'D&D Platform',
    APP_VERSION: '1.0.0',
    
    // UI Configuration
    ITEMS_PER_PAGE: 12,
    AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
    
    // Feature Flags
    FEATURES: {
        REALTIME_CHAT: true,
        REALTIME_COMBAT: true,
        FILE_UPLOADS: true,
        DICE_ROLLING: true,
        VOICE_CHAT: false, // Future feature
    },
    
    // Default Values
    DEFAULTS: {
        CAMPAIGN_DESCRIPTION: 'A new adventure begins...',
        CHARACTER_HP: 100,
        CHARACTER_AC: 10,
        CHARACTER_LEVEL: 1,
    },
    
    // Validation Rules
    VALIDATION: {
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 20,
        MIN_PASSWORD_LENGTH: 6,
        MAX_CAMPAIGN_NAME_LENGTH: 50,
        MAX_CHARACTER_NAME_LENGTH: 30,
    },
    
    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'dd_platform_auth_token',
        USER_DATA: 'dd_platform_user_data',
        THEME: 'dd_platform_theme',
        LANGUAGE: 'dd_platform_language',
        LAST_SECTION: 'dd_platform_last_section',
    },
    
    // Error Messages
    ERRORS: {
        NETWORK_ERROR: 'Network error. Please check your connection.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        NOT_FOUND: 'The requested resource was not found.',
        VALIDATION_ERROR: 'Please check your input and try again.',
        SERVER_ERROR: 'Server error. Please try again later.',
        UNKNOWN_ERROR: 'An unknown error occurred.',
    },
    
    // Success Messages
    SUCCESS: {
        LOGIN: 'Successfully logged in!',
        REGISTER: 'Account created successfully!',
        LOGOUT: 'Successfully logged out!',
        CAMPAIGN_CREATED: 'Campaign created successfully!',
        CAMPAIGN_UPDATED: 'Campaign updated successfully!',
        CAMPAIGN_DELETED: 'Campaign deleted successfully!',
        CHARACTER_CREATED: 'Character created successfully!',
        CHARACTER_UPDATED: 'Character updated successfully!',
        CHARACTER_DELETED: 'Character deleted successfully!',
        MONSTER_ADDED: 'Monster added to library!',
        JOURNAL_ENTRY_CREATED: 'Journal entry created!',
        JOURNAL_ENTRY_UPDATED: 'Journal entry updated!',
        JOURNAL_ENTRY_DELETED: 'Journal entry deleted!',
    },
    
    // Animation Durations (in milliseconds)
    ANIMATIONS: {
        FADE_IN: 300,
        FADE_OUT: 300,
        SLIDE_IN: 400,
        SLIDE_OUT: 400,
        MODAL_OPEN: 300,
        MODAL_CLOSE: 200,
    },
    
    // Color Scheme
    COLORS: {
        PRIMARY: '#667eea',
        PRIMARY_DARK: '#5a6fd8',
        SECONDARY: '#764ba2',
        SUCCESS: '#28a745',
        WARNING: '#ffc107',
        DANGER: '#dc3545',
        INFO: '#17a2b8',
        LIGHT: '#f8f9fa',
        DARK: '#343a40',
        WHITE: '#ffffff',
        GRAY: '#6c757d',
        GRAY_LIGHT: '#e1e5e9',
    },
    
    // Breakpoints for responsive design
    BREAKPOINTS: {
        MOBILE: 480,
        TABLET: 768,
        DESKTOP: 1024,
        LARGE_DESKTOP: 1200,
    },
    
    // Date Formats
    DATE_FORMATS: {
        DISPLAY: 'MMM DD, YYYY',
        DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
        ISO: 'YYYY-MM-DD',
        ISO_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    },
    
    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 12,
        MAX_PAGE_SIZE: 50,
        PAGE_SIZE_OPTIONS: [12, 24, 36, 50],
    },
    
    // File Upload
    FILE_UPLOAD: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        MAX_FILES: 5,
    },
    
    // Cache Configuration
    CACHE: {
        ENABLED: true,
        TTL: 5 * 60 * 1000, // 5 minutes
        MAX_ITEMS: 100,
    },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
