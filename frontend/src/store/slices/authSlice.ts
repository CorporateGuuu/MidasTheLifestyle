// Authentication Redux Slice for Midas The Lifestyle
// Manages user authentication state and user profile data

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthRequest, RegisterRequest, AuthResponse } from '@/types/api';
import { authApi, TokenManager } from '@/services/api';

// Auth State Interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastLoginAttempt: number | null;
  isAccountLocked: boolean;
  passwordResetRequested: boolean;
}

// Initial State
const initialState: AuthState = {
  user: null,
  token: TokenManager.getToken(),
  isAuthenticated: !!TokenManager.getToken(),
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
  isAccountLocked: false,
  passwordResetRequested: false,
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: AuthRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const { user, token } = response.data;
        TokenManager.setToken(token);
        return { user, token };
      } else {
        return rejectWithValue(response.error || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data) {
        const { user, token } = response.data;
        TokenManager.setToken(token);
        return { user, token };
      } else {
        return rejectWithValue(response.error || 'Registration failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const googleAuth = createAsyncThunk(
  'auth/googleAuth',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await authApi.googleAuth(code);
      if (response.success && response.data) {
        const { user, token } = response.data;
        TokenManager.setToken(token);
        return { user, token };
      } else {
        return rejectWithValue(response.error || 'Google authentication failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to get user data');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(userData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Profile update failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    passwordData: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.changePassword(passwordData);
      if (response.success) {
        return response.message || 'Password changed successfully';
      } else {
        return rejectWithValue(response.error || 'Password change failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        return response.message || 'Password reset email sent';
      } else {
        return rejectWithValue(response.error || 'Password reset request failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    resetData: { token: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authApi.resetPassword(resetData);
      if (response.success) {
        return response.message || 'Password reset successfully';
      } else {
        return rejectWithValue(response.error || 'Password reset failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Network error');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      TokenManager.clearTokens();
      return null;
    } catch (error: any) {
      // Even if logout fails on server, clear local tokens
      TokenManager.clearTokens();
      return null;
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordResetRequested: (state) => {
      state.passwordResetRequested = false;
    },
    updateUserData: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = Date.now();
      
      // Lock account after 5 failed attempts
      if (state.loginAttempts >= 5) {
        state.isAccountLocked = true;
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isAccountLocked = false;
    },
    checkAccountLockStatus: (state) => {
      // Unlock account after 15 minutes
      if (state.isAccountLocked && state.lastLoginAttempt) {
        const lockDuration = 15 * 60 * 1000; // 15 minutes
        if (Date.now() - state.lastLoginAttempt > lockDuration) {
          state.isAccountLocked = false;
          state.loginAttempts = 0;
          state.lastLoginAttempt = null;
        }
      }
    },
    initializeAuth: (state) => {
      const token = TokenManager.getToken();
      if (token && !TokenManager.isTokenExpired(token)) {
        state.token = token;
        state.isAuthenticated = true;
      } else {
        TokenManager.clearTokens();
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state.isAccountLocked = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loginAttempts += 1;
        state.lastLoginAttempt = Date.now();
        
        if (state.loginAttempts >= 5) {
          state.isAccountLocked = true;
        }
      });

    // Register User
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Google Auth
    builder
      .addCase(googleAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        TokenManager.clearTokens();
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.passwordResetRequested = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.passwordResetRequested = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.passwordResetRequested = false;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.passwordResetRequested = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout User
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state.isAccountLocked = false;
        state.passwordResetRequested = false;
      });
  },
});

// Export actions
export const {
  clearError,
  clearPasswordResetRequested,
  updateUserData,
  incrementLoginAttempts,
  resetLoginAttempts,
  checkAccountLockStatus,
  initializeAuth,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAccountLocked = (state: { auth: AuthState }) => state.auth.isAccountLocked;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;
export const selectUserTier = (state: { auth: AuthState }) => state.auth.user?.serviceProfile?.tier;

// Export reducer
export default authSlice.reducer;
