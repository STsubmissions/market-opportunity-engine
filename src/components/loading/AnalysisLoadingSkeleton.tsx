import React from 'react';
import { Box, Grid, Skeleton, Paper } from '@mui/material';

const StatCardSkeleton = () => (
  <Paper sx={{ p: 2, height: 140 }}>
    <Skeleton variant="text" width="60%" height={32} />
    <Skeleton variant="text" width="40%" height={48} sx={{ mt: 2 }} />
  </Paper>
);

const TableSkeleton = () => (
  <Paper sx={{ p: 2 }}>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={200} />
  </Paper>
);

const ChartSkeleton = () => (
  <Paper sx={{ p: 2 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={300} />
  </Paper>
);

const AnalysisLoadingSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="250px" height={48} sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Stats Cards */}
        {[1, 2, 3, 4].map((index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCardSkeleton />
          </Grid>
        ))}

        {/* Main Chart */}
        <Grid item xs={12} md={8}>
          <ChartSkeleton />
        </Grid>

        {/* Side Chart */}
        <Grid item xs={12} md={4}>
          <ChartSkeleton />
        </Grid>

        {/* Tables */}
        <Grid item xs={12}>
          <TableSkeleton />
        </Grid>

        <Grid item xs={12} md={6}>
          <TableSkeleton />
        </Grid>

        <Grid item xs={12} md={6}>
          <TableSkeleton />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisLoadingSkeleton;
