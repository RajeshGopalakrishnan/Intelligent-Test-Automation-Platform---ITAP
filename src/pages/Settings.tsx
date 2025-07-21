import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const settingsItems = [
  {
    title: 'User Profile',
    description: 'Manage your account settings and preferences',
    icon: <PersonIcon />,
  },
  {
    title: 'Security',
    description: 'Configure security settings and access controls',
    icon: <SecurityIcon />,
  },
  {
    title: 'Notifications',
    description: 'Set up email and system notifications',
    icon: <NotificationsIcon />,
  },
  {
    title: 'Test Storage',
    description: 'Configure test data storage and retention policies',
    icon: <StorageIcon />,
  },
  {
    title: 'System Configuration',
    description: 'Manage system-wide settings and integrations',
    icon: <BuildIcon />,
  },
];

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper>
            <List>
              {settingsItems.map((item, index) => (
                <React.Fragment key={item.title}>
                  <ListItem disablePadding>
                    <ListItemButton>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < settingsItems.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 