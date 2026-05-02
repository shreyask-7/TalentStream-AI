import apiClient from './client';

export const fetchMyApplications = async () => {
  const response = await apiClient.get('/applications/me');
  return response.data;
};

export const fetchRecruiterAnalytics = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};

export const submitApplication = async (formData) => {
  const response = await apiClient.post('/applications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateApplicationStatus = async (appId, status) => {
  const response = await apiClient.patch(`/applications/${appId}/status`, { status });
  return response.data;
};

export const submitApplicationFeedback = async (appId, feedback) => {
  const response = await apiClient.patch(`/applications/${appId}/feedback`, { feedback });
  return response.data;
};

export const downloadResume = async (appId) => {
  // CRITICAL: responseType 'blob' is required for files!
  const response = await apiClient.get(`/applications/${appId}/resume`, {
    responseType: "blob",
  });
  return response.data;
};