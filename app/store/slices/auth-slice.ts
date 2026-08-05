import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '~/lib/schema';

export type { AuthUser };

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth() {
      return initialState;
    },
  },
});

export const { setCredentials, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
