import api from './api';

export const journalService = {
  // Get all journal entries for the current user
  async getJournalEntries() {
    try {
      const response = await api.get('/journal');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Journal service error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch journal entries',
      };
    }
  },

  // Get a specific journal entry by ID
  async getJournalEntry(entryId) {
    try {
      const response = await api.get(`/journal/${entryId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch journal entry',
      };
    }
  },

  // Create a new journal entry
  async createJournalEntry(entryData) {
    try {
      const response = await api.post('/journal', entryData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create journal entry',
      };
    }
  },

  // Update a journal entry
  async updateJournalEntry(entryId, entryData) {
    try {
      const response = await api.put(`/journal/${entryId}`, entryData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update journal entry',
      };
    }
  },

  // Delete a journal entry
  async deleteJournalEntry(entryId) {
    try {
      const response = await api.delete(`/journal/${entryId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete journal entry',
      };
    }
  },

  // Get journal entries for a specific campaign
  async getCampaignJournalEntries(campaignId) {
    try {
      const response = await api.get(`/journal/campaign/${campaignId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch campaign journal entries',
      };
    }
  },

  // Search journal entries by tags
  async searchJournalEntries(tags) {
    try {
      const response = await api.get(`/journal/search?tags=${tags.join(',')}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search journal entries',
      };
    }
  },
};

