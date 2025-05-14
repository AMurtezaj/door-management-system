import api from './apiService';

// Get all notifications for current user
export const getAllNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
  }
};

// Get unread notifications count
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch unread count');
  }
};

// Mark notification as read
export const markAsRead = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete notification');
  }
};

// Subscribe to real-time notifications using WebSocket
export const subscribeToNotifications = (callback) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
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
      console.error('Notification WebSocket error:', error);
    };
    
    return socket;
  } catch (error) {
    console.error('Failed to subscribe to notifications:', error);
    return null;
  }
}; 