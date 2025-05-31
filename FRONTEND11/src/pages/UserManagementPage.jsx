import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Tooltip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getAllUsers, deleteUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/users/UserForm';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        `${user.emri} ${user.mbiemri}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roli === roleFilter);
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filtering
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setOpenForm(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormMode('edit');
    setOpenForm(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter(user => user.id !== selectedUser.id));
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete user', { variant: 'error' });
    } finally {
      setOpenDialog(false);
      setSelectedUser(null);
    }
  };

  const handleFormClose = (refresh = false) => {
    setOpenForm(false);
    if (refresh) {
      fetchUsers();
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.roli === 'admin').length;
    const managerUsers = users.filter(user => user.roli === 'menaxher').length;
    
    return { totalUsers, adminUsers, managerUsers };
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrator' : 'Manager';
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? <AdminIcon fontSize="small" /> : <ManagerIcon fontSize="small" />;
  };

  const stats = getUserStats();
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage system users and their permissions
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
          sx={{ borderRadius: 2, px: 3 }}
          size="large"
        >
          Add User
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {loading ? <Skeleton width={40} /> : stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Users
                </Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" color="error" sx={{ fontWeight: 600 }}>
                  {loading ? <Skeleton width={40} /> : stats.adminUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Administrators
                </Typography>
              </Box>
              <AdminIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {loading ? <Skeleton width={40} /> : stats.managerUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Managers
                </Typography>
              </Box>
              <ManagerIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Administrators</MenuItem>
                  <MenuItem value="menaxher">Managers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'right' }}>
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box>
                          <Skeleton width={120} height={20} />
                          <Skeleton width={80} height={16} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton width={200} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {searchTerm || roleFilter !== 'all' ? 'No users match your search criteria' : 'No users found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <Fade in={true} timeout={300 + index * 100} key={user.id}>
                    <TableRow hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getRoleColor(user.roli) + '.main',
                              width: 40,
                              height: 40
                            }}
                          >
                            {`${user.emri.charAt(0)}${user.mbiemri.charAt(0)}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {`${user.emri} ${user.mbiemri}`}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={getRoleIcon(user.roli)}
                          label={getRoleLabel(user.roli)}
                          color={getRoleColor(user.roli)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit User">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditUser(user)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={
                          user.id === currentUser.id 
                            ? "Cannot delete yourself" 
                            : (user.roli === 'admin' && users.filter(u => u.roli === 'admin').length <= 1)
                              ? "Cannot delete the last administrator"
                              : "Delete User"
                        }>
                          <span>
                            <IconButton 
                              color="error" 
                              onClick={() => handleDeleteClick(user)}
                              disabled={user.id === currentUser.id || (user.roli === 'admin' && users.filter(u => u.roli === 'admin').length <= 1)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{selectedUser?.emri} {selectedUser?.mbiemri}</strong>? 
            This action cannot be undone and will permanently remove all user data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Form Dialog */}
      {openForm && (
        <UserForm
          open={openForm}
          onClose={handleFormClose}
          user={selectedUser}
          mode={formMode}
        />
      )}
    </Box>
  );
};

export default UserManagementPage; 