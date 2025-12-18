import api from './api';

export const campaignService = {
  async getCampaigns() {
    try {
      const response = await api.get('/campaigns');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch campaigns' 
      };
    }
  },

  async getCampaign(campaignId) {
    try {
      const response = await api.get(`/campaigns/${campaignId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch campaign' 
      };
    }
  },

  async createCampaign(name) {
    try {
      const response = await api.post('/campaigns', { name });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create campaign' 
      };
    }
  },

  async getMembers(campaignId) {
    try {
      const response = await api.get(`/campaigns/${campaignId}/members`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch members' 
      };
    }
  },

  async addMember(campaignId, email, role = 'PLAYER') {
    try {
      const response = await api.post(`/campaigns/${campaignId}/members`, { email, role });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add member' 
      };
    }
  },

  async removeMember(campaignId, userId) {
    try {
      const response = await api.delete(`/campaigns/${campaignId}/members/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove member' 
      };
    }
  }
};
