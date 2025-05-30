import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Bell, Check, CheckAll, Trash, Filter, Search } from 'react-bootstrap-icons';
import { getAllNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, urgjent, paralajmërim, informacion
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAllNotifications();
      setNotifications(data);
      setError('');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications based on current filters
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, typeFilter, searchTerm]);

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle marking notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read');
    }
  };

  // Handle deleting notification
  const handleDeleteNotification = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
      } catch (error) {
        console.error('Error deleting notification:', error);
        setError('Failed to delete notification');
      }
    }
  };

  // Get notification type icon and color
  const getNotificationTypeInfo = (type) => {
    switch (type) {
      case 'urgjent':
        return { icon: '🚨', color: 'danger', label: 'Urgent' };
      case 'paralajmërim':
        return { icon: '⚠️', color: 'warning', label: 'Warning' };
      case 'informacion':
        return { icon: 'ℹ️', color: 'info', label: 'Info' };
      default:
        return { icon: '📢', color: 'secondary', label: 'Notification' };
    }
  };

  // Get statistics
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    urgent: notifications.filter(n => n.type === 'urgjent').length,
    warning: notifications.filter(n => n.type === 'paralajmërim').length,
    info: notifications.filter(n => n.type === 'informacion').length
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading notifications...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <Bell className="me-2" />
                Notifications
              </h2>
              <p className="text-muted mb-0">
                Manage your notifications and stay updated
              </p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={handleMarkAllAsRead}
                disabled={stats.unread === 0}
                className="me-2"
              >
                <CheckAll className="me-1" />
                Mark All Read
              </Button>
              <Button variant="outline-secondary" onClick={fetchNotifications}>
                <Bell className="me-1" />
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h5 className="text-primary">{stats.total}</h5>
              <small className="text-muted">Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h5 className="text-warning">{stats.unread}</h5>
              <small className="text-muted">Unread</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h5 className="text-danger">{stats.urgent}</h5>
              <small className="text-muted">Urgent</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h5 className="text-warning">{stats.warning}</h5>
              <small className="text-muted">Warning</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="text-center">
            <Card.Body>
              <h5 className="text-info">{stats.info}</h5>
              <small className="text-muted">Info</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <Filter className="me-1" />
                  Filter by Status
                </Form.Label>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Type</Form.Label>
                <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="urgjent">Urgent</option>
                  <option value="paralajmërim">Warning</option>
                  <option value="informacion">Info</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  <Search className="me-1" />
                  Search
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Notifications List */}
      <Row>
        <Col>
          {filteredNotifications.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <Bell size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No notifications found</h5>
                <p className="text-muted">
                  {notifications.length === 0 
                    ? "You don't have any notifications yet." 
                    : "No notifications match your current filters."
                  }
                </p>
              </Card.Body>
            </Card>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                return (
                  <Card 
                    key={notification.id} 
                    className={`mb-3 notification-card ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2" style={{ fontSize: '1.2rem' }}>
                              {typeInfo.icon}
                            </span>
                            <Badge bg={typeInfo.color} className="me-2">
                              {typeInfo.label}
                            </Badge>
                            {!notification.isRead && (
                              <Badge bg="primary" className="me-2">
                                New
                              </Badge>
                            )}
                            <small className="text-muted">
                              {new Date(notification.createdAt).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-0">{notification.message}</p>
                        </div>
                        <div className="d-flex align-items-center">
                          {!notification.isRead && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check size={16} />
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NotificationsPage; 