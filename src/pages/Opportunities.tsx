import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface OpportunityItem {
  keyword: string;
  position: number;
  volume: number;
  opportunity_score: number;
  competition?: number;
}

const OpportunityTable: React.FC<{
  opportunities: OpportunityItem[];
  title: string;
  description: string;
}> = ({ opportunities, title, description }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      {description}
    </Typography>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Keyword</TableCell>
            <TableCell align="right">Position</TableCell>
            <TableCell align="right">Volume</TableCell>
            <TableCell align="right">Score</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {opportunities.map((item) => (
            <TableRow key={item.keyword}>
              <TableCell component="th" scope="row">
                {item.keyword}
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={item.position}
                  size="small"
                  color={item.position <= 10 ? 'success' : 'warning'}
                />
              </TableCell>
              <TableCell align="right">{item.volume.toLocaleString()}</TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={item.opportunity_score * 10}
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography variant="body2">
                    {item.opportunity_score.toFixed(1)}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
);

const Opportunities: React.FC = () => {
  const { data, loading, error } = useSelector((state: RootState) => state.analysis);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data?.opportunities) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No opportunity data available. Please run a domain analysis first.
        </Alert>
      </Box>
    );
  }

  const { high_potential, quick_wins, competitive_gaps } = data.opportunities;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Market Opportunities
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <OpportunityTable
            opportunities={high_potential}
            title="High-Value Keywords"
            description="Keywords with high opportunity scores that represent significant growth potential."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <OpportunityTable
            opportunities={quick_wins}
            title="Quick Wins"
            description="Keywords ranking just off the first page that can be improved with minimal effort."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <OpportunityTable
            opportunities={competitive_gaps}
            title="Competitive Gaps"
            description="Keywords with low competition but high potential value."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Opportunities;
