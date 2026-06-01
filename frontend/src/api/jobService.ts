import axiosInstance from './axiosInstance';
import type { Application, Job } from '../types';

export const jobService = {
  getAll: async () => {
    const { data } = await axiosInstance.get<Job[]>('/jobs');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await axiosInstance.get<Job>(`/jobs/${id}`);
    return data;
  },

  create: async (job: Omit<Job, 'id' | 'recruiterName' | 'createdAt'>) => {
    const { data } = await axiosInstance.post<Job>('/jobs', job);
    return data;
  },

  getApplications: async (jobId: number) => {
    const { data } = await axiosInstance.get<Application[]>(`/jobs/${jobId}/applications`);
    return data;
  },
};
