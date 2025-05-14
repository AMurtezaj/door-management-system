import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  DoorOpen, DoorClosed, LockFill, ExclamationTriangleFill,
  PeopleFill, ClockHistory, Bell
} from 'react-bootstrap-icons';
import { getAllDoors } from '../services/doorService';
import { getAllNotifications } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [doors, setDoors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doorsLoading, setDoorsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDoors();
    fetchNotifications();
  }, []);
  
  // Fetch all doors
  const fetchDoors = async () => {
    try {
      const data = await getAllDoors();
      setDoors(data);
    } catch (error) {
      console.error('Error fetching doors:', error);
    } finally {
      setDoorsLoading(false);
    }
  };
  
  // Fetch recent notifications
  const fetchNotifications = async () => {
    try {
      const data = await getAllNotifications();
      setNotifications(data.slice(0, 5)); // Get only the 5 most recent
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };
  
  // Calculate door statistics
  const doorStats = {
    total: doors.length,
    open: doors.filter(door => door.status === 'open').length,
    closed: doors.filter(door => door.status === 'closed').length,
    locked: doors.filter(door => door.status === 'locked').length,
    alarm: doors.filter(door => door.status === 'alarm').length
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge bg="success">Open <DoorOpen className="ms-1" /></Badge>;
      case 'closed':
        return <Badge bg="info">Closed <DoorClosed className="ms-1" /></Badge>;
      case 'locked':
        return <Badge bg="primary">Locked <LockFill className="ms-1" /></Badge>;
      case 'alarm':
        return <Badge bg="danger">Alarm <ExclamationTriangleFill className="ms-1" /></Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Dashboard</h3>
        <div className="text-muted">
          Welcome back, {user?.emri} {user?.mbiemri}
        </div>
      </div>
      
      <Row className="mb-4">
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-stat-card shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-primary text-primary">
                <DoorOpen size={24} />
              </div>
              <div className="ms-3">
                <h6 className="stat-label">Open Doors</h6>
                <h4 className="stat-value text-primary">{doorStats.open}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-stat-card shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-info text-info">
                <DoorClosed size={24} />
              </div>
              <div className="ms-3">
                <h6 className="stat-label">Closed Doors</h6>
                <h4 className="stat-value text-info">{doorStats.closed}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-stat-card shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-primary text-primary">
                <LockFill size={24} />
              </div>
              <div className="ms-3">
                <h6 className="stat-label">Locked Doors</h6>
                <h4 className="stat-value">{doorStats.locked}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3 mb-md-0">
          <Card className="dashboard-stat-card shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-danger text-danger">
                <ExclamationTriangleFill size={24} />
              </div>
              <div className="ms-3">
                <h6 className="stat-label">Doors in Alarm</h6>
                <h4 className="stat-value text-danger">{doorStats.alarm}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <DoorClosed className="me-2" />
                <h5 className="mb-0">Recent Door Activities</h5>
              </div>
              <Link to="/doors" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {doorsLoading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-2 text-muted">Loading doors...</p>
                </div>
              ) : doors.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No doors found.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Door</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doors.slice(0, 7).map(door => (
                        <tr key={door.id}>
                          <td>
                            <Link to={`/doors/${door.id}`} className="text-decoration-none">
                              {door.name}
                            </Link>
                          </td>
                          <td>{door.location}</td>
                          <td>{getStatusBadge(door.status)}</td>
                          <td>{new Date(door.lastActivity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <Bell className="me-2" />
                <h5 className="mb-0">Recent Notifications</h5>
              </div>
              <Link to="/notifications" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {notificationsLoading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-2 text-muted">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No notifications found.</p>
                </div>
              ) : (
                <div className="notification-list">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`notification-item p-3 border-bottom ${!notification.read ? 'unread' : ''}`}>
                      <div className="d-flex">
                        <div className="notification-icon me-3">
                          {notification.type === 'door' && <DoorClosed className="text-primary" />}
                          {notification.type === 'access' && <PeopleFill className="text-warning" />}
                          {notification.type === 'alert' && <ExclamationTriangleFill className="text-danger" />}
                          {notification.type === 'system' && <ClockHistory className="text-info" />}
                        </div>
                        <div>
                          <div className="notification-title fw-bold">{notification.title}</div>
                          <div className="notification-text text-muted">{notification.message}</div>
                          <div className="notification-time small text-muted mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 