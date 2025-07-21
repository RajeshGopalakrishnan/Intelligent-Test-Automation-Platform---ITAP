import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface TestSuite {
  id: string;
  name: string;
  totalTests: number;
}

const mockTestSuites: TestSuite[] = [
  { id: '1', name: 'Authentication Tests', totalTests: 15 },
  { id: '2', name: 'User Management Tests', totalTests: 25 },
  { id: '3', name: 'Integration Tests', totalTests: 40 },
];

const TestExecution: React.FC = () => {
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStartExecution = () => {
    setIsRunning(true);
    setProgress(0);
    // Simulate test execution progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 1000);
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    setProgress(0);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Execution
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="test-suite-label">Select Test Suite</InputLabel>
                  <Select
                    labelId="test-suite-label"
                    value={selectedSuite}
                    label="Select Test Suite"
                    onChange={(e) => setSelectedSuite(e.target.value as string)}
                    disabled={isRunning}
                  >
                    {mockTestSuites.map((suite) => (
                      <MenuItem key={suite.id} value={suite.id}>
                        {suite.name} ({suite.totalTests} tests)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartExecution}
                    disabled={!selectedSuite || isRunning}
                    fullWidth
                  >
                    Start Execution
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={handleStopExecution}
                    disabled={!isRunning}
                    fullWidth
                  >
                    Stop Execution
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    disabled={isRunning}
                    fullWidth
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {isRunning && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Execution Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${progress}% Complete`} color="primary" />
                <Chip label="Running" color="success" />
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TestExecution; 