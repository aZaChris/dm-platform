// API Client for D&D Platform Web Client
class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = this.getAuthToken();
    }

    // Get authentication token from localStorage
    getAuthToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    }

    // Set authentication token
    setAuthToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        }
    }

    // Get headers for API requests
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic HTTP request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response statuses
            if (response.status === 401) {
                // Unauthorized - clear token and let caller handle UI (avoid reload loop)
                this.setAuthToken(null);
                throw new Error(CONFIG.ERRORS.UNAUTHORIZED);
            }
            
            if (response.status === 403) {
                throw new Error(CONFIG.ERRORS.UNAUTHORIZED);
            }
            
            if (response.status === 404) {
                throw new Error(CONFIG.ERRORS.NOT_FOUND);
            }
            
            if (response.status >= 500) {
                throw new Error(CONFIG.ERRORS.SERVER_ERROR);
            }

            // Parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Check if response indicates success
            if (!response.ok) {
                throw new Error(data.message || data.error || CONFIG.ERRORS.UNKNOWN_ERROR);
            }

            return {
                success: true,
                data: data,
                status: response.status,
            };

        } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(CONFIG.ERRORS.NETWORK_ERROR);
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET',
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    // PATCH request
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // File upload
    async uploadFile(endpoint, file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
                if (onProgress && event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            success: true,
                            data: data,
                            status: xhr.status,
                        });
                    } catch (error) {
                        resolve({
                            success: true,
                            data: xhr.responseText,
                            status: xhr.status,
                        });
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error(CONFIG.ERRORS.NETWORK_ERROR));
            });

            xhr.open('POST', `${this.baseURL}${endpoint}`);
            
            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            
            xhr.send(formData);
        });
    }

    // Authentication Methods
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.success) {
            const tok = response.data?.token || response.data?.access_token;
            if (tok) this.setAuthToken(tok);
        }
        return response;
    }

    async register(username, email, password) {
        // Backend expects { email, password, name }; also returns access_token
        const response = await this.post('/auth/register', { email, password, name: username });
        if (response.success) {
            const tok = response.data?.token || response.data?.access_token;
            if (tok) this.setAuthToken(tok);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error);
        } finally {
            this.setAuthToken(null);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        }
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    // Campaign Methods
    async getCampaigns() {
        return this.get('/campaigns');
    }

    async getCampaign(id) {
        return this.get(`/campaigns/${id}`);
    }

    async createCampaign(campaignData) {
        return this.post('/campaigns', campaignData);
    }

    async updateCampaign(id, campaignData) {
        return this.put(`/campaigns/${id}`, campaignData);
    }

    async deleteCampaign(id) {
        return this.delete(`/campaigns/${id}`);
    }

    async listCampaignMembers(id) {
        return this.get(`/campaigns/${id}/members`);
    }

    async removeCampaignMember(id, userId) {
        return this.delete(`/campaigns/${id}/members/${userId}`);
    }

    async addCampaignMember(id, email, role = 'PLAYER') {
        return this.post(`/campaigns/${id}/members`, { email, role });
    }

    async updateCampaignMemberRole(id, userId, role) {
        return this.put(`/campaigns/${id}/members/${userId}/role`, { role });
    }

    async updateCampaignMemberPermissions(id, userId, perms) {
        return this.put(`/campaigns/${id}/members/${userId}/permissions`, perms || {});
    }

    // Campaign Invitations
    async createInvitation(campaignId, role = 'PLAYER', expiresAt = null) {
        return this.post(`/campaigns/${campaignId}/invitations`, { role, expiresAt });
    }

    async listInvitations(campaignId) {
        return this.get(`/campaigns/${campaignId}/invitations`);
    }

    async acceptInvitation(token) {
        return this.post(`/campaigns/invitations/accept/${token}`);
    }

    async revokeInvitation(campaignId, token) {
        return this.delete(`/campaigns/${campaignId}/invitations/${token}`);
    }

    async joinCampaign(id) {
        return this.post(`/campaigns/${id}/join`);
    }

    async leaveCampaign(id) {
        return this.post(`/campaigns/${id}/leave`);
    }

    async getCampaignPermissions(id) {
        return this.get(`/campaigns/${id}/permissions`);
    }
    
    // Character Methods
    async getCharacters() {
        return this.get('/characters');
    }

    async getCharacter(id) {
        return this.get(`/characters/${id}`);
    }

    async createCharacter(characterData) {
        return this.post('/characters', characterData);
    }

    async updateCharacter(id, characterData) {
        return this.put(`/characters/${id}`, characterData);
    }

    async deleteCharacter(id) {
        return this.delete(`/characters/${id}`);
    }

    // Monster Methods
    async getMonsters(params = {}) {
        return this.get('/monsters', params);
    }

    async getMonster(id) {
        return this.get(`/monsters/${id}`);
    }

    async createMonster(monsterData) {
        return this.post('/monsters', monsterData);
    }

    async updateMonster(id, monsterData) {
        return this.put(`/monsters/${id}`, monsterData);
    }

    async deleteMonster(id) {
        return this.delete(`/monsters/${id}`);
    }

    // Journal Methods
    async getJournalEntries(campaignId = null) {
        const params = campaignId ? { campaignId } : {};
        return this.get('/journal', params);
    }

    async getJournalEntry(id) {
        return this.get(`/journal/${id}`);
    }

    async createJournalEntry(entryData) {
        return this.post('/journal', entryData);
    }

    async updateJournalEntry(id, entryData) {
        return this.put(`/journal/${id}`, entryData);
    }

    async deleteJournalEntry(id) {
        return this.delete(`/journal/${id}`);
    }

    // Combat Methods (aligned to backend routes)
    async getCombatsByCampaign(campaignId) {
        return this.get(`/combat/campaign/${campaignId}`);
    }

    async createCombat(campaignId, name) {
        return this.post('/combat', { campaignId, name });
    }

    async startCombatById(combatId) {
        return this.post(`/combat/${combatId}/start`);
    }

    async nextTurn(combatId) {
        return this.post(`/combat/${combatId}/next-turn`);
    }

    async endCombatById(combatId) {
        return this.post(`/combat/${combatId}/end`);
    }

    async addParticipant(combatId, data) {
        return this.post(`/combat/${combatId}/participants`, data);
    }

    async updateParticipant(participantId, data) {
        return this.put(`/combat/participants/${participantId}`, data);
    }

    async removeParticipant(participantId) {
        return this.delete(`/combat/participants/${participantId}`);
    }

    // Utility Methods
    async healthCheck() {
        try {
            // Some servers may not expose /health; treat network reachability as healthy
            const resp = await fetch(`${this.baseURL}/auth/login`, { method: 'OPTIONS' });
            return resp.status >= 200 && resp.status < 500; // reachable
        } catch (error) {
            return false;
        }
    }

    // Cache management
    clearCache() {
        if (window.caches) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    }

    // Error handling utility
    handleError(error) {
        console.error('API Error:', error);
        
        // Show user-friendly error message
        const message = error.message || CONFIG.ERRORS.UNKNOWN_ERROR;
        
        // You can integrate this with your UI notification system
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
        } else {
            alert(message);
        }
        
        return {
            success: false,
            error: message,
        };
    }
}

// Create global API instance
const api = new API();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
} else {
    window.api = api;
}
