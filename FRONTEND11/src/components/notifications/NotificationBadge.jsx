import React, { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'react-bootstrap-icons';
import { getUnreadCount, getAllNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import './NotificationBadge.css';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };
  
  // Fetch recent notifications
  const fetchNotifications = async () => {
    if (showDropdown) {
      setLoading(true);
      try {
        const data = await getAllNotifications();
        setNotifications(data.slice(0, 5)); // Show only 5 recent notifications
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Effect to fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Effect to fetch notifications when dropdown is opened
  useEffect(() => {
    fetchNotifications();
  }, [showDropdown]);
  
  // Handle marking a notification as read
  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <Dropdown 
      align="end"
      show={showDropdown}
      onToggle={(isOpen) => setShowDropdown(isOpen)}
    >
      <Dropdown.Toggle as="div" id="notification-dropdown" className="notification-toggle">
        <div className="notification-icon position-relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              pill 
              bg="danger" 
              className="notification-badge position-absolute"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown shadow-lg border-0">
        <div className="notification-header d-flex justify-content-between align-items-center px-3 py-2">
          <h6 className="m-0">Notifications</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-link btn-sm p-0 text-decoration-none" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        <Dropdown.Divider className="m-0" />
        
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map(notification => (
              <Dropdown.Item 
                key={notification.id} 
                as={Link}
                to={notification.link || '/notifications'}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="d-flex align-items-start">
                  <div className="flex-grow-1">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-text small text-muted">{notification.message}</div>
                    <div className="notification-time small text-muted">
                      {new Date(notification.createdAt).toLocaleTimeString()} - {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <button 
                      className="btn btn-sm text-primary mark-read-btn"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </Dropdown.Item>
            ))}
            <Dropdown.Divider className="m-0" />
            <Dropdown.Item as={Link} to="/notifications" className="text-center py-2">
              View All Notifications
            </Dropdown.Item>
          </>
        ) : (
          <div className="text-center py-3 text-muted">
            No notifications
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBadge; 