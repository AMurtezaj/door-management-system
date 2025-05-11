import React, { useState, useEffect } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import { createUser, merrPerdoruesit, updateUser } from '../services/userService';
import { Button, Box, Snackbar, Alert, CircularProgress, Typography } from '@mui/material';
import { Add, Close } from '@mui/icons-material';

const UsersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [perdoruesit, setPerdoruesit] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await merrPerdoruesit();
      console.log('Users data:', data);
      setPerdoruesit(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.message || 'Nuk u ngarkuan përdoruesit! Kontrolloni lidhjen me serverin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (userData) => {
    setLoading(true);
    try {
      console.log('Adding new user:', userData);
      await createUser(userData);
      setSuccess('Përdoruesi u shtua me sukses!');
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to add user:', err);
      setError(err.response?.data?.message || 'Shtimi dështoi! Kontrolloni lidhjen me serverin.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userData) => {
    setLoading(true);
    try {
      console.log('Updating user:', userData);
      await updateUser(editUser.id, userData);
      setSuccess('Përdoruesi u përditësua me sukses!');
      setEditUser(null);
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err.response?.data?.message || 'Përditësimi dështoi! Kontrolloni lidhjen me serverin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = (type) => {
    if (type === 'error') {
      setError('');
    } else {
      setSuccess('');
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Menaxhimi i Përdoruesve
        </Typography>
        
        <Button
          variant="contained"
          color={showForm ? "secondary" : "primary"}
          onClick={() => { setShowForm(!showForm); setEditUser(null); }}
          disabled={loading}
          startIcon={showForm ? <Close /> : <Add />}
        >
          {showForm ? 'Mbyll Formën' : 'Shto Përdorues të Ri'}
        </Button>
      </Box>
      
      {loading && !showForm && !editUser && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}
      
      {(showForm || editUser) && (
        <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editUser ? 'Përditëso Përdoruesin' : 'Shto Përdorues të Ri'}
          </Typography>
          <UserForm
            onSubmit={editUser ? handleEditUser : handleAddUser}
            defaultValues={editUser || {}}
            isEdit={!!editUser}
            loading={loading}
          />
        </Box>
      )}
      
      <UserList
        perdoruesit={perdoruesit}
        setPerdoruesit={setPerdoruesit}
        onEdit={(user) => { setEditUser(user); setShowForm(true); }}
      />
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={4000} 
        onClose={() => handleCloseSnackbar('error')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => handleCloseSnackbar('error')}>{error}</Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => handleCloseSnackbar('success')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => handleCloseSnackbar('success')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage; 