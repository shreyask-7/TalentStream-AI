import apiClient from './client';

export const fetchJobs = async () => {
  const response = await apiClient.get('/jobs');
  return response.data;
};

export const fetchMyJobs = async () => {
  const response = await apiClient.get('/jobs/my-jobs');
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await apiClient.post('/jobs', jobData);
  return response.data;
};

export const deleteJob = async (id) => {
  const response = await apiClient.delete(`/jobs/${id}`);
  return response.data;
};

export const fetchJobApplications = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}/applications`);
  return response.data;
};