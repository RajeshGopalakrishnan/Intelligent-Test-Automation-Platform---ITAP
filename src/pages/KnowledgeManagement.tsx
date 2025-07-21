import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface TestCase {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
}

const mockTestCases: TestCase[] = [
  {
    id: '1',
    title: 'Login Authentication Test',
    description: 'Verify user authentication flow with valid and invalid credentials',
    lastUpdated: '2024-03-15',
  },
  {
    id: '2',
    title: 'User Registration Test',
    description: 'Validate user registration process with email verification',
    lastUpdated: '2024-03-14',
  },
  {
    id: '3',
    title: 'Password Reset Test',
    description: 'Test password reset functionality and email notifications',
    lastUpdated: '2024-03-13',
  },
];

const KnowledgeManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>(mockTestCases);

  const filteredTestCases = testCases.filter((testCase) =>
    testCase.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Knowledge Management
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Search Test Cases"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ minWidth: '200px' }}
              >
                Add Test Case
              </Button>
            </Box>
            <List>
              {filteredTestCases.map((testCase) => (
                <React.Fragment key={testCase.id}>
                  <ListItem>
                    <ListItemText
                      primary={testCase.title}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {testCase.description}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" color="text.secondary">
                            Last updated: {testCase.lastUpdated}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KnowledgeManagement; 