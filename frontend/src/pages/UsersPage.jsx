import React, { useState, useEffect } from 'react';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import { shtoPerdorues, merrPerdoruesit, perditesoPerdorues } from '../services/userService';
import { Button, Box, Snackbar, Alert, CircularProgress } from '@mui/material';

const UsersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [perdoruesit, setPerdoruesit] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await merrPerdoruesit();
        setPerdoruesit(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Nuk u ngarkuan përdoruesit! Kontrolloni lidhjen me serverin.');
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (teDhenat) => {
    setLoading(true);
    try {
      await shtoPerdorues(teDhenat);
      setSuccess('Përdoruesi u shtua me sukses!');
      setShowForm(false);
      const data = await merrPerdoruesit();
      setPerdoruesit(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to add user:', err);
      setError('Shtimi dështoi! Kontrolloni lidhjen me serverin.');
      setLoading(false);
    }
  };

  const handleEditUser = async (teDhenat) => {
    setLoading(true);
    try {
      await perditesoPerdorues(editUser.id, teDhenat);
      setSuccess('Përdoruesi u përditësua me sukses!');
      setEditUser(null);
      setShowForm(false);
      const data = await merrPerdoruesit();
      setPerdoruesit(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Përditësimi dështoi! Kontrolloni lidhjen me serverin.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => { setShowForm(!showForm); setEditUser(null); }}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        {showForm ? 'Mbyll Formën' : 'Shto Përdorues të Ri'}
      </Button>
      
      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}
      
      {(showForm || editUser) && (
        <UserForm
          onSubmit={editUser ? handleEditUser : handleAddUser}
          defaultValues={editUser || {}}
          isEdit={!!editUser}
        />
      )}
      
      <UserList
        perdoruesit={perdoruesit}
        setPerdoruesit={setPerdoruesit}
        onEdit={(user) => { setEditUser(user); setShowForm(true); }}
      />
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={4000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage; 