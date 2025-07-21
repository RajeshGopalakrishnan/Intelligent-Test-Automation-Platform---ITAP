import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from '@mui/material';

interface TestReport {
  id: string;
  testSuite: string;
  executionDate: string;
  duration: string;
  totalTests: number;
  passed: number;
  failed: number;
  status: 'success' | 'failure' | 'partial';
}

const mockReports: TestReport[] = [
  {
    id: '1',
    testSuite: 'Authentication Tests',
    executionDate: '2024-03-15 14:30',
    duration: '5m 30s',
    totalTests: 15,
    passed: 13,
    failed: 2,
    status: 'partial',
  },
  {
    id: '2',
    testSuite: 'User Management Tests',
    executionDate: '2024-03-15 13:45',
    duration: '8m 15s',
    totalTests: 25,
    passed: 25,
    failed: 0,
    status: 'success',
  },
  {
    id: '3',
    testSuite: 'Integration Tests',
    executionDate: '2024-03-15 12:00',
    duration: '15m 45s',
    totalTests: 40,
    passed: 35,
    failed: 5,
    status: 'partial',
  },
];

const Reports: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: TestReport['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failure':
        return 'error';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Test Reports
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Suite</TableCell>
                    <TableCell>Execution Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell align="right">Total Tests</TableCell>
                    <TableCell align="right">Passed</TableCell>
                    <TableCell align="right">Failed</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockReports
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.testSuite}</TableCell>
                        <TableCell>{report.executionDate}</TableCell>
                        <TableCell>{report.duration}</TableCell>
                        <TableCell align="right">{report.totalTests}</TableCell>
                        <TableCell align="right">{report.passed}</TableCell>
                        <TableCell align="right">{report.failed}</TableCell>
                        <TableCell>
                          <Chip
                            label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={mockReports.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 