import api from './api';

export const characterService = {
  // Get all characters for the current user
  async getCharacters() {
    try {
      const response = await api.get('/characters');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Character service error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch characters',
      };
    }
  },

  // Get a specific character by ID
  async getCharacter(characterId) {
    try {
      const response = await api.get(`/characters/${characterId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch character',
      };
    }
  },

  // Create a new character
  async createCharacter(characterData) {
    try {
      const response = await api.post('/characters', characterData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create character',
      };
    }
  },

  // Update a character
  async updateCharacter(characterId, characterData) {
    try {
      const response = await api.put(`/characters/${characterId}`, characterData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update character',
      };
    }
  },

  // Delete a character
  async deleteCharacter(characterId) {
    try {
      const response = await api.delete(`/characters/${characterId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete character',
      };
    }
  },

  // Get characters for a specific campaign
  async getCampaignCharacters(campaignId) {
    try {
      const response = await api.get(`/characters/campaign/${campaignId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch campaign characters',
      };
    }
  },
};

