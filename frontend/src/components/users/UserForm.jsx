import React from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, MenuItem, Box, Typography, Paper } from '@mui/material';
import DoorFrontIcon from '@mui/icons-material/DoorFront';

const roles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'menaxher', label: 'Menaxher' }
];

const UserForm = ({ onSubmit, defaultValues = {}, isEdit = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  return (
    <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <DoorFrontIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight="bold">
          {isEdit ? 'Përditëso Përdoruesin' : 'Shto Përdorues të Ri'}
        </Typography>
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Emri"
          fullWidth
          margin="normal"
          {...register('emri', { required: 'Emri është i detyrueshëm' })}
          error={!!errors.emri}
          helperText={errors.emri?.message}
        />
        <TextField
          label="Mbiemri"
          fullWidth
          margin="normal"
          {...register('mbiemri', { required: 'Mbiemri është i detyrueshëm' })}
          error={!!errors.mbiemri}
          helperText={errors.mbiemri?.message}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          type="email"
          {...register('email', { required: 'Email-i është i detyrueshëm' })}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        {!isEdit && (
          <TextField
            label="Fjalëkalimi"
            fullWidth
            margin="normal"
            type="password"
            {...register('password', { required: 'Fjalëkalimi është i detyrueshëm' })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
        <TextField
          label="Roli"
          select
          fullWidth
          margin="normal"
          defaultValue={defaultValues.roli || ''}
          {...register('roli', { required: 'Roli është i detyrueshëm' })}
          error={!!errors.roli}
          helperText={errors.roli?.message}
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
          sx={{ mt: 2 }}
        >
          {isEdit ? 'Ruaj Ndryshimet' : 'Shto Përdoruesin'}
        </Button>
      </form>
    </Paper>
  );
};

export default UserForm; 