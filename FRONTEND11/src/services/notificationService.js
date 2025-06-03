import api from './apiService';

// Get all notifications for current user
export const getAllNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.warn('Notifications API not available, returning empty array:', error);
    return [];
  }
};

// Create new notification - Enhanced with fallback
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  } catch (error) {
    console.warn('Notification creation failed, storing locally:', error);
    
    // Fallback: Store notification locally (in localStorage for demo purposes)
    const localNotification = {
      id: Date.now(),
      ...notificationData,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    try {
      const existingNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const updatedNotifications = [localNotification, ...existingNotifications];
      localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      
      console.log('Notification stored locally:', localNotification);
      return localNotification;
    } catch (storageError) {
      console.warn('Failed to store notification locally:', storageError);
      return localNotification;
    }
  }
};

// Create overdue order notification
export const createOverdueOrderNotification = async (order) => {
  try {
    const notificationData = {
      message: `Porosia e planifikuar për ${order.emriKlientit} ${order.mbiemriKlientit} në datën ${order.dita} ende nuk është shënuar si e përfunduar.`,
      type: 'warning',
      category: 'overdue_order',
      relatedOrderId: order.id,
      priority: 'high'
    };
    
    return await createNotification(notificationData);
  } catch (error) {
    console.warn('Error creating overdue order notification:', error);
    // Don't throw error - this is not critical for the main functionality
    return null;
  }
};

// Create capacity warning notification
export const createCapacityWarningNotification = async (date, message) => {
  try {
    const notificationData = {
      message: message,
      type: 'warning',
      category: 'capacity_warning',
      relatedDate: date,
      priority: 'medium'
    };
    
    return await createNotification(notificationData);
  } catch (error) {
    console.warn('Error creating capacity warning notification:', error);
    return null;
  }
};

// Create order rescheduled notification
export const createOrderRescheduledNotification = async (order, oldDate, newDate) => {
  try {
    const notificationData = {
      message: `Porosia për ${order.emriKlientit} ${order.mbiemriKlientit} u riplanifikua nga ${oldDate} në ${newDate}.`,
      type: 'info',
      category: 'order_rescheduled',
      relatedOrderId: order.id,
      priority: 'medium'
    };
    
    return await createNotification(notificationData);
  } catch (error) {
    console.warn('Error creating order rescheduled notification:', error);
    return null;
  }
};

// Get unread notifications count - Enhanced with fallback
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  } catch (error) {
    console.warn('Unread count API not available, checking local notifications:', error);
    
    // Fallback: Check local notifications
    try {
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const unreadCount = localNotifications.filter(n => !n.isRead).length;
      return { count: unreadCount };
    } catch (storageError) {
      return { count: 0 };
    }
  }
};

// Mark notification as read - Enhanced with fallback
export const markAsRead = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.warn('Mark as read API not available, updating locally:', error);
    
    // Fallback: Update local notifications
    try {
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const updatedNotifications = localNotifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      );
      localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      return { success: true };
    } catch (storageError) {
      console.warn('Failed to update local notification:', storageError);
      return { success: false };
    }
  }
};

// Mark all notifications as read - Enhanced with fallback
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.warn('Mark all as read API not available, updating locally:', error);
    
    // Fallback: Update all local notifications
    try {
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const updatedNotifications = localNotifications.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      return { success: true };
    } catch (storageError) {
      console.warn('Failed to update local notifications:', storageError);
      return { success: false };
    }
  }
};

// Delete notification - Enhanced with fallback
export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.warn('Delete notification API not available, removing locally:', error);
    
    // Fallback: Remove from local notifications
    try {
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      const updatedNotifications = localNotifications.filter(n => n.id !== id);
      localStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      return { success: true };
    } catch (storageError) {
      console.warn('Failed to remove local notification:', storageError);
      return { success: false };
    }
  }
};

// Subscribe to real-time notifications using WebSocket - Enhanced with fallback
export const subscribeToNotifications = (callback) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return null;
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsEndpoint = `${wsProtocol}//${window.location.host}/api/notifications/ws`;
    
    const socket = new WebSocket(`${wsEndpoint}?token=${token}`);
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('Notification WebSocket connection closed');
      // Try to reconnect after a few seconds
      setTimeout(() => subscribeToNotifications(callback), 5000);
    };
    
    socket.onerror = (error) => {
      console.warn('Notification WebSocket error, WebSocket not available:', error);
      // Don't try to reconnect if WebSocket is not supported
      return null;
    };
    
    return socket;
  } catch (error) {
    console.warn('Failed to subscribe to notifications, WebSocket not available:', error);
    return null;
  }
};

// Get all notifications including local ones - Enhanced implementation
export const getAllNotificationsWithLocal = async () => {
  try {
    // Try to get from API first
    const apiNotifications = await getAllNotifications();
    
    // Get local notifications as fallback
    const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
    
    // Combine and deduplicate (API notifications take priority)
    const allNotifications = [...apiNotifications];
    
    // Add local notifications that aren't already in API results
    localNotifications.forEach(localNotif => {
      const exists = apiNotifications.some(apiNotif => 
        apiNotif.id === localNotif.id || 
        (apiNotif.relatedOrderId === localNotif.relatedOrderId && 
         apiNotif.category === localNotif.category)
      );
      
      if (!exists) {
        allNotifications.push(localNotif);
      }
    });
    
    // Sort by creation date (newest first)
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return allNotifications;
  } catch (error) {
    console.warn('Error getting combined notifications:', error);
    
    // Final fallback: return only local notifications
    try {
      const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
      return localNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (storageError) {
      return [];
    }
  }
}; 