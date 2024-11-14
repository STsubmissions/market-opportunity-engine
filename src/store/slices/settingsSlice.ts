import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  apiKey: string | null;
  theme: 'light' | 'dark';
  refreshInterval: number; // in minutes
  maxCompetitors: number;
  notificationsEnabled: boolean;
  defaultFilters: {
    minOpportunityScore: number;
    minSearchVolume: number;
    maxPosition: number;
  };
}

const initialState: SettingsState = {
  apiKey: localStorage.getItem('seranking_api_key'),
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  refreshInterval: Number(localStorage.getItem('refreshInterval')) || 60,
  maxCompetitors: Number(localStorage.getItem('maxCompetitors')) || 5,
  notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true',
  defaultFilters: {
    minOpportunityScore: 7,
    minSearchVolume: 100,
    maxPosition: 20,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload;
      localStorage.setItem('seranking_api_key', action.payload);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
      localStorage.setItem('refreshInterval', String(action.payload));
    },
    setMaxCompetitors: (state, action: PayloadAction<number>) => {
      state.maxCompetitors = action.payload;
      localStorage.setItem('maxCompetitors', String(action.payload));
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
      localStorage.setItem('notificationsEnabled', String(action.payload));
    },
    updateDefaultFilters: (state, action: PayloadAction<Partial<SettingsState['defaultFilters']>>) => {
      state.defaultFilters = { ...state.defaultFilters, ...action.payload };
    },
  },
});

export const {
  setApiKey,
  setTheme,
  setRefreshInterval,
  setMaxCompetitors,
  setNotificationsEnabled,
  updateDefaultFilters,
} = settingsSlice.actions;

export default settingsSlice.reducer;
