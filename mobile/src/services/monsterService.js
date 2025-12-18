import api from './api';

export const monsterService = {
  // Get all monsters for the current user
  async getMonsters() {
    try {
      const response = await api.get('/monsters');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch monsters',
      };
    }
  },

  // Get a specific monster by ID
  async getMonster(monsterId) {
    try {
      const response = await api.get(`/monsters/${monsterId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch monster',
      };
    }
  },

  // Create a new monster
  async createMonster(monsterData) {
    try {
      const response = await api.post('/monsters', monsterData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create monster',
      };
    }
  },

  // Update a monster
  async updateMonster(monsterId, monsterData) {
    try {
      const response = await api.put(`/monsters/${monsterId}`, monsterData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update monster',
      };
    }
  },

  // Delete a monster
  async deleteMonster(monsterId) {
    try {
      const response = await api.delete(`/monsters/${monsterId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete monster',
      };
    }
  },

  // Get monsters for a specific campaign
  async getCampaignMonsters(campaignId) {
    try {
      const response = await api.get(`/monsters/campaign/${campaignId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch campaign monsters',
      };
    }
  },
};

