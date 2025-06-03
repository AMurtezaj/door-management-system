import React, { useState, useEffect } from 'react';
import { 
  Dropdown, 
  Badge, 
  ListGroup, 
  Spinner, 
  Alert,
  Button 
} from 'react-bootstrap';
import { 
  Bell, 
  BellFill, 
  ExclamationTriangleFill, 
  InfoCircle, 
  CheckCircle, 
  ArrowRepeat,
  Trash,
  Eye
} from 'react-bootstrap-icons';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';
import { 
  getAllNotificationsWithLocal, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications 
} from '../../services/notificationService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the enhanced function that combines API and local notifications
      const [notificationsData, countData] = await Promise.all([
        getAllNotificationsWithLocal(),
        getUnreadCount()
      ]);
      
      setNotifications(notificationsData || []);
      setUnreadCount(countData?.count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Gabim gjatë marrjes së njoftimeve');
      
      // Fallback: Try to load only local notifications
      try {
        const localNotifications = JSON.parse(localStorage.getItem('localNotifications') || '[]');
        setNotifications(localNotifications);
        setUnreadCount(localNotifications.filter(n => !n.isRead).length);
      } catch (localError) {
        console.error('Error loading local notifications:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Fallback: Update locally anyway
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Fallback: Update locally anyway
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Fallback: Update locally anyway
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Get notification icon based on type and category
  const getNotificationIcon = (notification) => {
    switch (notification.category) {
      case 'overdue_order':
        return <ExclamationTriangleFill className="text-warning" />;
      case 'order_rescheduled':
        return <ArrowRepeat className="text-info" />;
      case 'capacity_warning':
        return <ExclamationTriangleFill className="text-warning" />;
      case 'order_completed':
        return <CheckCircle className="text-success" />;
      default:
        return <InfoCircle className="text-primary" />;
    }
  };

  // Get notification priority class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'notification-high-priority';
      case 'medium':
        return 'notification-medium-priority';
      case 'low':
        return 'notification-low-priority';
      default:
        return '';
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: sq });
    } catch (error) {
      return dateString;
    }
  };

  // Initialize component
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const socket = subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Listen for localStorage changes (notifications created by other components)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'localNotifications') {
        // Refresh notifications when localStorage changes
        fetchNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (in case of same-tab updates)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <Dropdown 
      show={show} 
      onToggle={setShow}
      className="notification-center"
    >
      <Dropdown.Toggle 
        variant="link" 
        className="notification-toggle"
        id="notification-dropdown"
      >
        <div className="notification-bell">
          {unreadCount > 0 ? (
            <BellFill className="text-warning" size={20} />
          ) : (
            <Bell className="text-muted" size={20} />
          )}
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              className="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu 
        className="notification-menu" 
        align="end"
      >
        <div className="notification-header">
          <h6 className="mb-0">Njoftimet</h6>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              Shëno të gjitha si të lexuara
            </Button>
          )}
        </div>

        <div className="notification-body">
          {loading ? (
            <div className="notification-loading">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Duke ngarkuar...</span>
            </div>
          ) : error ? (
            <Alert variant="info" className="mb-0">
              <InfoCircle className="me-2" />
              <small>
                Njoftimet janë duke punuar në modalitet lokal. 
                {notifications.length > 0 && ` ${notifications.length} njoftime të disponueshme.`}
              </small>
            </Alert>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={32} className="text-muted mb-2" />
              <p className="text-muted mb-0">Nuk ka njoftime</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.slice(0, 10).map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                  action
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  data-category={notification.category}
                >
                  <div className="notification-content">
                    <div className="notification-icon">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="notification-text">
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <small className="notification-time text-muted">
                        {formatNotificationDate(notification.createdAt)}
                      </small>
                    </div>
                    <div className="notification-actions">
                      {!notification.isRead && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title="Shëno si të lexuar"
                        >
                          <Eye size={14} />
                        </Button>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        title="Fshi njoftimin"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>

        {notifications.length > 10 && (
          <div className="notification-footer">
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setShow(false);
                // Navigate to full notifications page if needed
              }}
            >
              Shiko të gjitha njoftimet ({notifications.length})
            </Button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationCenter; 