import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

const TestReports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Reports
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography>Test reports and analytics will be displayed here.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestReports; 