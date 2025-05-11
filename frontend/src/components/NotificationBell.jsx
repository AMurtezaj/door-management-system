import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, List, ListItem, ListItemText, Typography, Divider, Box, Button } from '@mui/material';
import { Notifications, MarkEmailRead } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Get only the most recent 5 notifications
      const data = await notificationService.getNotifications();
      const recentNotifications = Array.isArray(data) ? data.slice(0, 5) : [];
      setNotifications(recentNotifications);
      
      const unread = recentNotifications.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    fetchNotifications(); // Refresh on open
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(
        notifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
    handleClose();
  };

  const handleViewAll = () => {
    navigate('/notifications');
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            maxWidth: '350px',
            width: '350px',
            maxHeight: '400px',
            overflow: 'auto',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              startIcon={<MarkEmailRead />} 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id || index}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    backgroundColor: notification.read ? 'inherit' : 'action.hover',
                    px: 2,
                    py: 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    // Navigate to the notification detail or mark as read
                    navigate('/notifications');
                    handleClose();
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2" 
                        color="text.primary"
                        sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                      >
                        {notification.title || 'Notification Title'}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {(notification.message || 'Notification message').substring(0, 60)}
                          {(notification.message || '').length > 60 ? '...' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, yyyy') : ''}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            onClick={handleViewAll}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell; 