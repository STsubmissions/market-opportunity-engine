import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

// Import chart components (to be created)
import OpportunityScoreChart from '../components/charts/OpportunityScoreChart';
import MarketTrendChart from '../components/charts/MarketTrendChart';
import CompetitorAnalysisChart from '../components/charts/CompetitorAnalysisChart';

const StatCard = ({ title, value, icon, color }: any) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: 140,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        opacity: 0.1,
        transform: 'rotate(15deg)',
      }}
    >
      {icon}
    </Box>
    <Typography component="h2" variant="h6" color="primary" gutterBottom>
      {title}
    </Typography>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

export default function Dashboard() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Market Growth"
            value="+24.5%"
            icon={<TrendingUpIcon sx={{ fontSize: 100 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Opportunity Score"
            value="8.4"
            icon={<ShowChartIcon sx={{ fontSize: 100 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Market Size"
            value="$4.2B"
            icon={<TimelineIcon sx={{ fontSize: 100 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Competitor Count"
            value="127"
            icon={<AssessmentIcon sx={{ fontSize: 100 }} />}
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Market Trends
            </Typography>
            <MarketTrendChart />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Opportunity Score Distribution
            </Typography>
            <OpportunityScoreChart />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Competitor Landscape
            </Typography>
            <CompetitorAnalysisChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
