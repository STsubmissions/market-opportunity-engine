import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface AnalysisState {
  loading: boolean;
  error: string | null;
  data: any | null;
  lastAnalyzedDomain: string | null;
  analysisHistory: any[];
}

const initialState: AnalysisState = {
  loading: false,
  error: null,
  data: null,
  lastAnalyzedDomain: null,
  analysisHistory: [],
};

export const startAnalysis = createAsyncThunk(
  'analysis/startAnalysis',
  async (analysisData: any) => {
    const response = await axios.post('http://localhost:8000/api/moe/analyze', analysisData);
    return response.data;
  }
);

export const fetchDomainOverview = createAsyncThunk(
  'analysis/fetchDomainOverview',
  async (domain: string) => {
    const response = await axios.get(`http://localhost:8000/api/moe/domain/${domain}/overview`);
    return response.data;
  }
);

export const fetchOpportunities = createAsyncThunk(
  'analysis/fetchOpportunities',
  async (domain: string) => {
    const response = await axios.get(`http://localhost:8000/api/moe/domain/${domain}/opportunities`);
    return response.data;
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearAnalysis: (state) => {
      state.data = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Start Analysis
    builder.addCase(startAnalysis.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startAnalysis.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
      state.lastAnalyzedDomain = action.payload.prospect.domain;
      state.analysisHistory.push({
        date: new Date().toISOString(),
        domain: action.payload.prospect.domain,
        data: action.payload,
      });
    });
    builder.addCase(startAnalysis.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'An error occurred during analysis';
    });

    // Fetch Domain Overview
    builder.addCase(fetchDomainOverview.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDomainOverview.fulfilled, (state, action) => {
      state.loading = false;
      state.data = {
        ...state.data,
        overview: action.payload,
      };
    });
    builder.addCase(fetchDomainOverview.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch domain overview';
    });

    // Fetch Opportunities
    builder.addCase(fetchOpportunities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOpportunities.fulfilled, (state, action) => {
      state.loading = false;
      state.data = {
        ...state.data,
        opportunities: action.payload,
      };
    });
    builder.addCase(fetchOpportunities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch opportunities';
    });
  },
});

export const { clearAnalysis, clearError } = analysisSlice.actions;
export default analysisSlice.reducer;
