import apiClient from './client';

// 1. Candidate applying for a job
export const submitApplication = async (formData) => {
  const response = await apiClient.post('/applications', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 2. Recruiter updating pipeline status
export const updateApplicationStatus = async (appId, status) => {
  const response = await apiClient.patch(`/applications/${appId}/status`, { status });
  return response.data;
};

// 3. Recruiter submitting AI feedback (Thumbs up/down)
export const submitApplicationFeedback = async (appId, feedback) => {
  const response = await apiClient.patch(`/applications/${appId}/feedback`, { feedback });
  return response.data;
};

// 4. Secure Resume Download
export const downloadResume = async (appId) => {
  const response = await apiClient.get(`/applications/${appId}/resume`, {
    responseType: "blob", // CRITICAL for PDFs
  });
  return response.data;
};