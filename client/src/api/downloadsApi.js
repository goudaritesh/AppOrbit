import api from './axios';

export const downloadsApi = {
  // Initiate secure download session
  initiateDownload: (appId, data = {}) =>
    api.post(`/apps/${appId}/download`, data),

  // Confirm download completion
  completeDownload: (sessionId) =>
    api.post(`/downloads/${sessionId}/complete`),

  // User download history
  getUserDownloads: (params = {}) =>
    api.get('/me/downloads', { params }),
};

export default downloadsApi;
