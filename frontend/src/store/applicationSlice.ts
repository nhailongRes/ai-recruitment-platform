import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import { applicationService } from '../api/applicationService';
import type { Application } from '../types';

export const fetchMyApplications = createAsyncThunk('applications/fetchMine', async () => {
  return applicationService.getMyApplications();
});

export const applyToJob = createAsyncThunk(
  'applications/apply',
  async (jobId: number, { rejectWithValue }) => {
    try {
      await applicationService.apply(jobId);
      return jobId;
    } catch (err) {
      if (isAxiosError(err) && typeof err.response?.data === 'string') {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue('Nộp đơn thất bại');
    }
  }
);

const applicationSlice = createSlice({
  name: 'applications',
  initialState: {
    myApplications: [] as Application[],
    loading: false,
    error: null as string | null,
    applySuccess: false,
  },
  reducers: {
    clearApplicationError: (state) => {
      state.error = null;
    },
    clearApplySuccess: (state) => {
      state.applySuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.myApplications = action.payload;
      })
      .addCase(fetchMyApplications.rejected, (state) => {
        state.loading = false;
        state.error = 'Không thể tải đơn ứng tuyển';
      })
      .addCase(applyToJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.applySuccess = false;
      })
      .addCase(applyToJob.fulfilled, (state) => {
        state.loading = false;
        state.applySuccess = true;
      })
      .addCase(applyToJob.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Nộp đơn thất bại';
      });
  },
});

export const { clearApplicationError, clearApplySuccess } = applicationSlice.actions;
export default applicationSlice.reducer;
