import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import UserProfile from '../components/users/UserProfile';

const ProfilePage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Profile
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage your profile information
        </Typography>
      </Box>
      <UserProfile />
    </Container>
  );
};

export default ProfilePage; 