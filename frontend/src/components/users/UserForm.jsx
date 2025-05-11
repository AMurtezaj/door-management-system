import React from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, MenuItem, Box, Typography, Paper, CircularProgress } from '@mui/material';
import { Save, PersonAdd } from '@mui/icons-material';
import DoorFrontIcon from '@mui/icons-material/DoorFront';

const roles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'menaxher', label: 'Menaxher' }
];

const UserForm = ({ onSubmit, defaultValues = {}, isEdit = false, loading = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  const passwordValidation = isEdit
    ? {}
    : {
        required: 'Fjalëkalimi është i detyrueshëm',
        minLength: {
          value: 6,
          message: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere'
        }
      };

  const emailValidation = {
    required: 'Email-i është i detyrueshëm',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Email-i nuk është valid'
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <DoorFrontIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          {isEdit ? 'Përditëso Përdoruesin' : 'Shto Përdorues të Ri'}
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Emri"
              fullWidth
              {...register('emri', { required: 'Emri është i detyrueshëm' })}
              error={!!errors.emri}
              helperText={errors.emri?.message}
              disabled={loading}
            />
            <TextField
              label="Mbiemri"
              fullWidth
              {...register('mbiemri', { required: 'Mbiemri është i detyrueshëm' })}
              error={!!errors.mbiemri}
              helperText={errors.mbiemri?.message}
              disabled={loading}
            />
          </Box>
          <TextField
            label="Email"
            fullWidth
            type="email"
            {...register('email', emailValidation)}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading}
          />
          {!isEdit && (
            <TextField
              label="Fjalëkalimi"
              fullWidth
              type="password"
              {...register('password', passwordValidation)}
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
            />
          )}
          <TextField
            label="Roli"
            select
            fullWidth
            defaultValue={defaultValues.roli || ''}
            {...register('roli', { required: 'Roli është i detyrueshëm' })}
            error={!!errors.roli}
            helperText={errors.roli?.message}
            disabled={loading}
          >
            {roles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={24} /> : isEdit ? <Save /> : <PersonAdd />}
            sx={{ mt: 1 }}
          >
            {loading
              ? isEdit ? 'Duke ruajtur...' : 'Duke shtuar...'
              : isEdit ? 'Ruaj Ndryshimet' : 'Shto Përdoruesin'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default UserForm; 