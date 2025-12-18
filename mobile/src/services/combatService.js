import api from './api';

export const combatService = {
  async getCombats(campaignId) {
    try {
      const response = await api.get(`/combat/campaign/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch combats' 
      };
    }
  },

  async getCombat(combatId) {
    try {
      const response = await api.get(`/combat/${combatId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch combat' 
      };
    }
  },

  async createCombat(campaignId, name) {
    try {
      const response = await api.post('/combat', { campaignId, name });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create combat' 
      };
    }
  },

  async addParticipant(combatId, participantData) {
    try {
      const response = await api.post(`/combat/${combatId}/participants`, participantData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add participant' 
      };
    }
  },

  async updateParticipant(participantId, data) {
    try {
      const response = await api.put(`/combat/participants/${participantId}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update participant' 
      };
    }
  },

  async removeParticipant(participantId) {
    try {
      const response = await api.delete(`/combat/participants/${participantId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove participant' 
      };
    }
  },

  async startCombat(combatId) {
    try {
      const response = await api.post(`/combat/${combatId}/start`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to start combat' 
      };
    }
  },

  async nextTurn(combatId) {
    try {
      const response = await api.post(`/combat/${combatId}/next-turn`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to advance turn' 
      };
    }
  },

  async endCombat(combatId) {
    try {
      const response = await api.post(`/combat/${combatId}/end`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to end combat' 
      };
    }
  }
};
