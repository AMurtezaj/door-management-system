import api from './api';

export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    try {
      return await api.get('/notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get notification by ID
  getNotificationById: async (id) => {
    try {
      return await api.get(`/notifications/${id}`);
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  },

  // Create new notification
  createNotification: async (notificationData) => {
    try {
      return await api.post('/notifications', notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Update notification
  updateNotification: async (id, notificationData) => {
    try {
      return await api.put(`/notifications/${id}`, notificationData);
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      return await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      return await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      return await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      return await api.get('/notifications/unread-count');
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}; 