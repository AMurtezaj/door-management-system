import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Box
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { registerUser, updateUser } from '../../services/authService';

const UserForm = ({ open, onClose, user, mode }) => {
  const initialFormData = {
    emri: '',
    mbiemri: '',
    email: '',
    password: '',
    roli: 'menaxher'
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        emri: user.emri || '',
        mbiemri: user.mbiemri || '',
        email: user.email || '',
        password: '', // Password is empty for edits
        roli: user.roli || 'menaxher'
      });
    } else {
      setFormData(initialFormData);
    }
  }, [user, mode]);
  
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
    
    // Password only required for new users
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim() && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.roli) newErrors.roli = 'Role is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (mode === 'create') {
        await registerUser(formData);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      } else {
        // Only send password if it's been updated
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) delete dataToUpdate.password;
        
        await updateUser(user.id, dataToUpdate);
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      }
      onClose(true); // Close with refresh flag
    } catch (error) {
      enqueueSnackbar(error.message || `Failed to ${mode === 'create' ? 'create' : 'update'} user`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Create New User' : 'Edit User'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="emri"
              label="First Name"
              value={formData.emri}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.emri}
              helperText={errors.emri}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="mbiemri"
              label="Last Name"
              value={formData.mbiemri}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.mbiemri}
              helperText={errors.mbiemri}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="password"
              label={mode === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={mode === 'create'}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required error={!!errors.roli} disabled={loading}>
              <InputLabel>Role</InputLabel>
              <Select
                name="roli"
                value={formData.roli}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="menaxher">Manager</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Saving...
            </Box>
          ) : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm; 