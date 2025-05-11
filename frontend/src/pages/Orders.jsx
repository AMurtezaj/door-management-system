import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { orderService } from '../services/orderService';
import OrderForm from '../components/features/orders/OrderForm';

const Orders = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getOrders
  });

  const createMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setOpenDialog(false);
      toast.success('Porosia u krijua me sukses');
    },
    onError: (error) => {
      toast.error(error.message || 'Dështoi krijimi i porosisë');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => orderService.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setOpenDialog(false);
      setSelectedOrder(null);
      toast.success('Porosia u përditësua me sukses');
    },
    onError: (error) => {
      toast.error(error.message || 'Dështoi përditësimi i porosisë');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: orderService.deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Porosia u fshi me sukses');
    },
    onError: (error) => {
      toast.error(error.message || 'Dështoi fshirja e porosisë');
    }
  });

  const handleCreate = () => {
    setSelectedOrder(null);
    setOpenDialog(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('A jeni të sigurt që dëshironi ta fshini këtë porosi?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data) => {
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Gabim gjatë ngarkimit të porosive: {error.message}
      </Alert>
    );
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'E Përfunduar';
      case 'in_progress':
        return 'Në Progres';
      case 'pending':
        return 'Në Pritje';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Porositë</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Porosi e Re
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Klienti</TableCell>
              <TableCell>Lloji i Derës</TableCell>
              <TableCell>Dimensionet</TableCell>
              <TableCell>Statusi</TableCell>
              <TableCell>Veprime</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.doorType}</TableCell>
                <TableCell>{order.dimensions}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(order.status)}
                    color={
                      order.status === 'completed' ? 'success' :
                      order.status === 'in_progress' ? 'primary' :
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(order)}
                      title="Përditëso"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(order.id)}
                      title="Fshi"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedOrder(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedOrder ? 'Përditëso Porosinë' : 'Krijo Porosi të Re'}
        </DialogTitle>
        <DialogContent>
          <OrderForm
            onSubmit={handleSubmit}
            initialData={selectedOrder}
            isEditing={!!selectedOrder}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Orders; 