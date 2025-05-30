import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge } from 'react-bootstrap';
import { getUnreadCount, getAllNotifications } from '../../services/notificationService';

const NotificationDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    token: null,
    unreadCount: null,
    notifications: null,
    errors: []
  });

  const testNotificationSystem = async () => {
    const errors = [];
    const info = { ...debugInfo };

    // Check token
    const token = localStorage.getItem('token');
    info.token = token ? 'Present' : 'Missing';

    try {
      // Test unread count
      console.log('🔍 Testing unread count...');
      const countData = await getUnreadCount();
      info.unreadCount = countData;
      console.log('✅ Unread count success:', countData);
    } catch (error) {
      console.error('❌ Unread count failed:', error);
      errors.push(`Unread count: ${error.message}`);
    }

    try {
      // Test get all notifications
      console.log('🔍 Testing get all notifications...');
      const notificationsData = await getAllNotifications();
      info.notifications = notificationsData;
      console.log('✅ Get notifications success:', notificationsData);
    } catch (error) {
      console.error('❌ Get notifications failed:', error);
      errors.push(`Get notifications: ${error.message}`);
    }

    info.errors = errors;
    setDebugInfo(info);
  };

  useEffect(() => {
    testNotificationSystem();
  }, []);

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>🔧 Notification System Debug</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Authentication Token:</strong>{' '}
          <Badge bg={debugInfo.token === 'Present' ? 'success' : 'danger'}>
            {debugInfo.token || 'Not checked'}
          </Badge>
        </div>

        <div className="mb-3">
          <strong>Unread Count:</strong>{' '}
          {debugInfo.unreadCount !== null ? (
            <Badge bg="info">{JSON.stringify(debugInfo.unreadCount)}</Badge>
          ) : (
            <Badge bg="secondary">Not tested</Badge>
          )}
        </div>

        <div className="mb-3">
          <strong>Notifications:</strong>{' '}
          {debugInfo.notifications !== null ? (
            <Badge bg="info">
              {Array.isArray(debugInfo.notifications) 
                ? `${debugInfo.notifications.length} notifications` 
                : 'Invalid response'}
            </Badge>
          ) : (
            <Badge bg="secondary">Not tested</Badge>
          )}
        </div>

        {debugInfo.errors.length > 0 && (
          <Alert variant="danger">
            <strong>Errors:</strong>
            <ul className="mb-0 mt-2">
              {debugInfo.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Button variant="primary" onClick={testNotificationSystem}>
          🔄 Retest
        </Button>

        {debugInfo.notifications && Array.isArray(debugInfo.notifications) && (
          <div className="mt-3">
            <strong>Sample Notifications:</strong>
            <div className="mt-2">
              {debugInfo.notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="border p-2 mb-2 rounded">
                  <Badge bg={notification.type === 'urgjent' ? 'danger' : 'warning'} className="me-2">
                    {notification.type}
                  </Badge>
                  {notification.message}
                  <br />
                  <small className="text-muted">
                    {new Date(notification.createdAt).toLocaleString()} - 
                    Read: {notification.isRead ? 'Yes' : 'No'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default NotificationDebug; 