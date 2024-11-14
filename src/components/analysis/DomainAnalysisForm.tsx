import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { startAnalysis } from '../../store/slices/analysisSlice';

interface DomainAnalysisFormProps {
  onAnalysisComplete?: () => void;
}

const DomainAnalysisForm: React.FC<DomainAnalysisFormProps> = ({ onAnalysisComplete }) => {
  const dispatch = useDispatch();
  const [prospectDomain, setProspectDomain] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [competitorDomains, setCompetitorDomains] = useState<string[]>([]);
  const [brandedTerms, setBrandedTerms] = useState('');
  const [negativeTerms, setNegativeTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCompetitor = () => {
    if (competitorDomain && !competitorDomains.includes(competitorDomain)) {
      setCompetitorDomains([...competitorDomains, competitorDomain]);
      setCompetitorDomain('');
    }
  };

  const handleRemoveCompetitor = (domain: string) => {
    setCompetitorDomains(competitorDomains.filter((d) => d !== domain));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const analysisData = {
        prospect_domain: prospectDomain,
        competitor_domains: competitorDomains,
        branded_terms: brandedTerms,
        negative_terms: negativeTerms,
        client_name: prospectDomain,
      };

      await dispatch(startAnalysis(analysisData));
      onAnalysisComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Start Market Analysis
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Your Domain"
            value={prospectDomain}
            onChange={(e) => setProspectDomain(e.target.value)}
            placeholder="e.g., yourdomain.com"
            required
            fullWidth
          />

          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <TextField
                label="Add Competitor Domain"
                value={competitorDomain}
                onChange={(e) => setCompetitorDomain(e.target.value)}
                placeholder="e.g., competitor.com"
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleAddCompetitor}
                disabled={!competitorDomain}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Stack>

            {competitorDomains.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Competitor Domains:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {competitorDomains.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      onDelete={() => handleRemoveCompetitor(domain)}
                      deleteIcon={<CloseIcon />}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          <TextField
            label="Branded Terms (Optional)"
            value={brandedTerms}
            onChange={(e) => setBrandedTerms(e.target.value)}
            placeholder="Enter branded terms separated by commas"
            multiline
            rows={2}
          />

          <TextField
            label="Negative Terms (Optional)"
            value={negativeTerms}
            onChange={(e) => setNegativeTerms(e.target.value)}
            placeholder="Enter negative terms separated by commas"
            multiline
            rows={2}
          />

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !prospectDomain || competitorDomains.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Analyzing...' : 'Start Analysis'}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default DomainAnalysisForm;
