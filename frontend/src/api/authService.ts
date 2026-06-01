import axiosInstance from './axiosInstance';
import type { LoginResponse } from '../types';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    fullName: string;
    role: string;
  }) => {
    const { data } = await axiosInstance.post<string>('/auth/register', payload);
    return data;
  },
};
