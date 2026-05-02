import apiClient from './client';

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const getProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};