import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jobService } from '../api/jobService';
import type { Application, Job } from '../types';

export const fetchJobs = createAsyncThunk('jobs/fetchAll', async () => {
  return jobService.getAll();
});

export const createJob = createAsyncThunk(
  'jobs/create',
  async (job: { title: string; description: string; requiredSkills: string }) => {
    return jobService.create(job);
  }
);

export const fetchJobApplications = createAsyncThunk(
  'jobs/fetchApplications',
  async (jobId: number) => {
    return jobService.getApplications(jobId);
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    items: [] as Job[],
    selectedApplications: [] as Application[],
    loading: false,
    error: null as string | null,
    createSuccess: false,
  },
  reducers: {
    clearJobError: (state) => {
      state.error = null;
    },
    clearCreateSuccess: (state) => {
      state.createSuccess = false;
    },
    clearSelectedApplications: (state) => {
      state.selectedApplications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchJobs.rejected, (state) => {
        state.loading = false;
        state.error = 'Không thể tải danh sách công việc';
      })
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Không thể tạo công việc';
      })
      .addCase(fetchJobApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedApplications = action.payload;
      })
      .addCase(fetchJobApplications.rejected, (state) => {
        state.loading = false;
        state.error = 'Không thể tải danh sách ứng viên';
      });
  },
});

export const { clearJobError, clearCreateSuccess, clearSelectedApplications } = jobSlice.actions;
export default jobSlice.reducer;
