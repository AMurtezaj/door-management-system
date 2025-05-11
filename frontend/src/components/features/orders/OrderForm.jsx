import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';

const OrderForm = ({ onSubmit, initialData = {}, isEditing = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Emri i Klientit"
            {...register('customerName', { required: 'Emri i klientit është i detyrueshëm' })}
            error={!!errors.customerName}
            helperText={errors.customerName?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Numri i Telefonit"
            {...register('phoneNumber', { required: 'Numri i telefonit është i detyrueshëm' })}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber?.message}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Adresa"
            {...register('address', { required: 'Adresa është e detyrueshme' })}
            error={!!errors.address}
            helperText={errors.address?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Lloji i Derës</InputLabel>
            <Select
              label="Lloji i Derës"
              {...register('doorType', { required: 'Lloji i derës është i detyrueshëm' })}
              error={!!errors.doorType}
            >
              <MenuItem value="interior">E Brendshme</MenuItem>
              <MenuItem value="exterior">E Jashtme</MenuItem>
              <MenuItem value="garage">Garazhi</MenuItem>
              <MenuItem value="security">Sigurimi</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Dimensionet"
            {...register('dimensions', { required: 'Dimensionet janë të detyrueshme' })}
            error={!!errors.dimensions}
            helperText={errors.dimensions?.message}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Shënime Shtesë"
            {...register('notes')}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
          >
            {isEditing ? 'Përditëso Porosinë' : 'Krijo Porosinë'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderForm; 