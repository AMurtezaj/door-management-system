import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  IconButton, 
  Button, 
  Paper,
  CircularProgress,
  Badge,
  Menu,
  MenuItem,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  MarkEmailRead, 
  DeleteOutline, 
  MoreVert, 
  Check,
  Warning,
  Info,
  ErrorOutline,
  CheckCircle,
  ShoppingCart,
  Payment
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMenuOpen = (event, notificationId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotificationId(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
    handleMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(
        notifications.map(notification => ({ ...notification, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(
        notifications.filter(notification => notification.id !== notificationId)
      );
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
    handleMenuClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart color="primary" />;
      case 'payment':
        return <Payment color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorOutline color="error" />;
      case 'success':
        return <CheckCircle color="success" />;
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationTime = (date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - notificationDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) {
      return formatDistanceToNow(notificationDate, { addSuffix: true });
    } else if (diffInDays < 7) {
      return format(notificationDate, 'EEEE');
    } else {
      return format(notificationDate, 'MMM d, yyyy');
    }
  };

  // Mock data for notification types since we don't know the actual structure
  const notificationTypes = ['info', 'warning', 'error', 'success', 'order', 'payment'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
            <NotificationsIcon />
          </Badge>
          
          <Button 
            variant="outlined" 
            startIcon={<MarkEmailRead />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
        </Box>
      </Box>
      
      <Paper elevation={3}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {notifications.map((notification, index) => {
              // For demo purposes, since we don't know the exact notification structure
              // Assign a random type if it doesn't exist
              const type = notification.type || notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
              
              return (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      position: 'relative',
                      py: 2
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="options"
                        onClick={(e) => handleMenuOpen(e, notification.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: notification.read ? 'grey.200' : 'primary.light',
                          color: notification.read ? 'text.secondary' : 'primary.main'
                        }}
                      >
                        {getNotificationIcon(type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="span" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                            {notification.title || 'Notification Title'}
                          </Typography>
                          {!notification.read && (
                            <Chip
                              label="New"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            {notification.message || 'Notification message appears here with details about the event.'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {getNotificationTime(notification.createdAt || new Date())}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMarkAsRead(selectedNotificationId)}>
          <ListItemIcon>
            <Check fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as read</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteNotification(selectedNotificationId)}>
          <ListItemIcon>
            <DeleteOutline fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Notifications; 