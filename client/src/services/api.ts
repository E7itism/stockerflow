/**
 * API Service - Makes calls to the backend
 */

import axios from 'axios';
import { DashboardData } from '../types/dashboard';

// Base URL for your backend
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Dashboard API calls
export const dashboardAPI = {
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard/stats');
    return response.data;
  },
};

export default api;
