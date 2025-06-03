import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Grid,
  Avatar,
  TextField,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PhotoCamera,
  Security,
  Person,
  Email,
  Badge,
  ExpandMore,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    emri: '',
    mbiemri: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (user) {
      setFormData({
        emri: user.emri || '',
        mbiemri: user.mbiemri || '',
        email: user.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        enqueueSnackbar('Image size should be less than 5MB', { variant: 'error' });
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emri.trim()) newErrors.emri = 'First name is required';
    if (!formData.mbiemri.trim()) newErrors.mbiemri = 'Last name is required';
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation only if password is provided
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Only send password if it's been updated
      const dataToUpdate = { 
        emri: formData.emri,
        mbiemri: formData.mbiemri,
        email: formData.email
      };
      
      if (formData.password) {
        dataToUpdate.password = formData.password;
      }
      
      // Handle profile image upload here if needed
      if (profileImage) {
        // In a real app, you'd upload the image to a server
        enqueueSnackbar('Profile image updated (demo)', { variant: 'info' });
      }
      
      await updateProfile(dataToUpdate);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      setIsEditing(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update profile', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(null);
    setFormData({
      emri: user.emri || '',
      mbiemri: user.mbiemri || '',
      email: user.email || '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Typography variant="h6" sx={{ p: 3 }}>
        User information not available
      </Typography>
    );
  }

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrator' : 'Manager';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Main Profile Card */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', mr: 3 }}>
          <Avatar 
                src={imagePreview}
            sx={{ 
                  width: 100, 
                  height: 100, 
              bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  boxShadow: 2
            }}
          >
                {!imagePreview && `${user.emri.charAt(0)}${user.mbiemri.charAt(0)}`}
          </Avatar>
              {isEditing && (
                <Tooltip title="Change profile picture">
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {`${user.emri} ${user.mbiemri}`}
            </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip 
                  icon={<Badge />}
                  label={getRoleLabel(user.roli)}
                  color={getRoleColor(user.roli)}
                  variant="outlined"
                />
                <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email fontSize="small" />
                  {user.email}
            </Typography>
          </Box>
            </Box>
            
          {!isEditing && (
            <Button 
                variant="contained" 
                startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
                sx={{ borderRadius: 2 }}
            >
              Edit Profile
            </Button>
          )}
        </Box>

          <Divider sx={{ my: 3 }} />

          {/* Profile Information */}
        {isEditing ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person />
                Edit Profile Information
              </Typography>
              
              {profileImage && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Profile picture will be updated when you save changes.
                </Alert>
              )}
              
              <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="emri"
                value={formData.emri}
                onChange={handleChange}
                error={!!errors.emri}
                helperText={errors.emri}
                disabled={loading}
                    variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="mbiemri"
                value={formData.mbiemri}
                onChange={handleChange}
                error={!!errors.mbiemri}
                helperText={errors.mbiemri}
                disabled={loading}
                    variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading}
                    variant="outlined"
              />
            </Grid>
                
                {/* Security Section */}
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Security />
                        <Typography variant="h6">Security Settings</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password (leave blank to keep current)"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={loading}
                            variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading || !formData.password}
                            variant="outlined"
              />
            </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                disabled={loading}
                    sx={{ borderRadius: 2 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                onClick={handleSave}
                disabled={loading}
                    sx={{ borderRadius: 2 }}
              >
                    {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
            </Box>
        ) : (
            <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user.email}
              </Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Role
              </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getRoleLabel(user.roli)}
              </Typography>
                </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>

      {/* Account Statistics Card */}
      {!isEditing && (
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Account Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                    {user.id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    User ID
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                    Active
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Account Status
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                    {new Date().getFullYear()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Member Since
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserProfile; 