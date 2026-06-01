import axiosInstance from './axiosInstance';
import type { Application } from '../types';

export const applicationService = {
  apply: async (jobId: number) => {
    const { data } = await axiosInstance.post<string>(`/applications/apply/${jobId}`);
    return data;
  },

  getMyApplications: async () => {
    const { data } = await axiosInstance.get<Application[]>('/applications/my-applications');
    return data;
  },
};
