import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const studentId = localStorage.getItem('student_id');
  if (studentId && !config.headers['X-Student-Id']) {
    config.headers['X-Student-Id'] = studentId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string }>) => {
    let message = 'An unexpected error occurred.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);
