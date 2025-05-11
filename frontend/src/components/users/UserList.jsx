import React, { useEffect, useState } from 'react';
import { merrPerdoruesit, fshiPerdorues } from '../../services/userService';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import EditIcon from '@mui/icons-material/Edit';
import { blue, grey } from '@mui/material/colors';

const UserList = ({ perdoruesit, setPerdoruesit, onEdit }) => {
  const [error, setError] = useState('');

  const handleDelete = async (id) => {
    if (window.confirm('Jeni i sigurt që doni të fshini këtë përdorues?')) {
      try {
        await fshiPerdorues(id);
        setPerdoruesit(perdoruesit.filter(u => u.id !== id));
      } catch {
        setError('Fshirja dështoi!');
      }
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
      {error && (
        <Typography color="error" mb={2}>{error}</Typography>
      )}
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
            {perdoruesit.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.emri}</TableCell>
                <TableCell>{u.mbiemri}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.roli}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => onEdit(u)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(u.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserList; 