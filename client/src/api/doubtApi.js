import apiClient from './axios';

export const doubtApi = {
  getDoubts: async () => {
    return await apiClient.get('/doubts');
  },

  getDoubtById: async (id) => {
    return await apiClient.get(`/doubts/${id}`);
  },

  createDoubt: async (data) => {
    return await apiClient.post('/doubts', data);
  },

  addReply: async (id, data) => {
    return await apiClient.post(`/doubts/${id}/replies`, data);
  },

  upvoteDoubt: async (id) => {
    return await apiClient.post(`/doubts/${id}/upvote`);
  },

  acceptReply: async (doubtId, replyId) => {
    return await apiClient.post(`/doubts/${doubtId}/replies/${replyId}/accept`);
  },
};
