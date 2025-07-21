import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Total Tests" />
            <CardContent>
              <Typography variant="h3" align="center">
                124
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Passing Tests" />
            <CardContent>
              <Typography variant="h3" align="center" color="success.main">
                98
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Failing Tests" />
            <CardContent>
              <Typography variant="h3" align="center" color="error.main">
                26
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader title="Success Rate" />
            <CardContent>
              <Typography variant="h3" align="center" color="primary.main">
                79%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Test Executions
            </Typography>
            {/* Add a table or list of recent test executions here */}
            <Typography variant="body2" color="text.secondary">
              No recent test executions found.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Knowledge Management Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total test cases documented: 85
              <br />
              Last updated: 2 hours ago
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography variant="body2" color="success.main">
              All systems operational
              <br />
              Last check: 5 minutes ago
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 