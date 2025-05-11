import React, { useState } from 'react';
import { deleteUser } from '../../services/userService';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, 
  Typography, Box, Snackbar, Alert, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import EditIcon from '@mui/icons-material/Edit';
import { blue, grey } from '@mui/material/colors';

const UserList = ({ perdoruesit, setPerdoruesit, onEdit }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Jeni i sigurt që doni të fshini këtë përdorues?')) {
      try {
        setLoading(true);
        setDeletingId(id);
        await deleteUser(id);
        setPerdoruesit(perdoruesit.filter(u => u.id !== id));
        setSuccess('Përdoruesi u fshi me sukses!');
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.message || 'Fshirja dështoi! Kontrolloni lidhjen me serverin.');
      } finally {
        setLoading(false);
        setDeletingId(null);
      }
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
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <DoorFrontIcon sx={{ color: blue[700], fontSize: 40, mr: 1 }} />
        <Typography variant="h5" color={blue[900]} fontWeight="bold">
          Lista e Përdoruesve
        </Typography>
      </Box>
      
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ background: grey[100] }}>
            <TableRow>
              <TableCell>Emri</TableCell>
              <TableCell>Mbiemri</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roli</TableCell>
              <TableCell align="right">Veprime</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {perdoruesit.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Nuk ka përdorues për të shfaqur
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              perdoruesit.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.emri}</TableCell>
                  <TableCell>{u.mbiemri}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.roli}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => onEdit(u)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(u.id)}
                      disabled={loading || deletingId === u.id}
                    >
                      {loading && deletingId === u.id ? (
                        <CircularProgress size={24} color="error" />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
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

export default UserList; 