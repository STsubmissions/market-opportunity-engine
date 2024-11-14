import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  setApiKey,
  setRefreshInterval,
  setMaxCompetitors,
  setNotificationsEnabled,
  updateDefaultFilters,
} from '../store/slices/settingsSlice';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* API Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Configuration
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="SE Ranking API Key"
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey || ''}
                onChange={(e) => dispatch(setApiKey(e.target.value))}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showApiKey}
                    onChange={(e) => setShowApiKey(e.target.checked)}
                  />
                }
                label="Show API Key"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Analysis Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Settings
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Refresh Interval (minutes)</Typography>
              <Slider
                value={settings.refreshInterval}
                onChange={(_, value) => dispatch(setRefreshInterval(value as number))}
                min={15}
                max={120}
                step={15}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Maximum Competitors</Typography>
              <Slider
                value={settings.maxCompetitors}
                onChange={(_, value) => dispatch(setMaxCompetitors(value as number))}
                min={1}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Default Filters
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Minimum Opportunity Score</Typography>
                <Slider
                  value={settings.defaultFilters.minOpportunityScore}
                  onChange={(_, value) =>
                    dispatch(updateDefaultFilters({ minOpportunityScore: value as number }))
                  }
                  min={1}
                  max={10}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Minimum Search Volume</Typography>
                <Slider
                  value={settings.defaultFilters.minSearchVolume}
                  onChange={(_, value) =>
                    dispatch(updateDefaultFilters({ minSearchVolume: value as number }))
                  }
                  min={0}
                  max={1000}
                  step={50}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Maximum Position</Typography>
                <Slider
                  value={settings.defaultFilters.maxPosition}
                  onChange={(_, value) =>
                    dispatch(updateDefaultFilters({ maxPosition: value as number }))
                  }
                  min={10}
                  max={50}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={(e) => dispatch(setNotificationsEnabled(e.target.checked))}
                />
              }
              label="Enable Notifications"
            />
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Settings saved successfully!
        </Alert>
      )}
    </Box>
  );
};

export default Settings;
