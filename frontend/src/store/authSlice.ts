import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { isAxiosError } from 'axios';
import { authService } from '../api/authService';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.token);
    return response;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: { email: string; password: string; fullName: string; role: string },
    { rejectWithValue }
  ) => {
    try {
      await authService.register(data);
    } catch (err) {
      if (isAxiosError(err) && typeof err.response?.data === 'string') {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue('Đăng ký thất bại');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null,
    fullName: localStorage.getItem('fullName') || null,
    loading: false,
    error: null as string | null,
    registerSuccess: false,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.fullName = null;
      state.error = null;
      localStorage.clear();
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.fullName = action.payload.fullName;
        localStorage.setItem('role', action.payload.role);
        localStorage.setItem('fullName', action.payload.fullName);
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
        state.error = 'Email hoặc mật khẩu không đúng';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registerSuccess = false;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.registerSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Đăng ký thất bại';
      });
  },
});

export const { logout, clearAuthError, clearRegisterSuccess } = authSlice.actions;
export default authSlice.reducer;
