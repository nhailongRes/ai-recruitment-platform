import axiosInstance from './axiosInstance';
import type { Profile } from '../types';

export const profileService = {
  get: async () => {
    const { data } = await axiosInstance.get<Profile>('/profile');
    return data;
  },

  update: async (profile: Profile) => {
    const { data } = await axiosInstance.put<Profile>('/profile', profile);
    return data;
  },
};
