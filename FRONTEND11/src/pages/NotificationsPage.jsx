import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner, Tabs, Tab, Table } from 'react-bootstrap';
import { 
  Bell, 
  Check, 
  CheckAll, 
  Trash, 
  Filter, 
  Search, 
  Gear,
  Play,
  Stop,
  ClockHistory,
  Calendar2Event,
  ExclamationTriangle,
  CheckCircle,
  InfoCircle
} from 'react-bootstrap-icons';
import { 
  getAllNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getScheduledJobsStatus,
  triggerOverdueCheck,
  triggerDebtReport,
  startScheduledJobs,
  stopScheduledJobs
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { canEditOrders, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, urgjent, paralajmërim, informacion
  const [searchTerm, setSearchTerm] = useState('');

  // System management state
  const [jobsStatus, setJobsStatus] = useState(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [systemMessage, setSystemMessage] = useState(null);

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

  // Fetch scheduled jobs status
  const fetchJobsStatus = async () => {
    if (!isManager) return;
    
    try {
      setSystemLoading(true);
      const status = await getScheduledJobsStatus();
      setJobsStatus(status);
    } catch (error) {
      console.error('Error fetching jobs status:', error);
      setSystemMessage({
        type: 'error',
        text: 'Gabim gjatë marrjes së statusit të sistemit'
      });
    } finally {
      setSystemLoading(false);
    }
  };

  // Handle manual trigger for overdue check
  const handleTriggerOverdue = async () => {
    try {
      setActionLoading('overdue');
      await triggerOverdueCheck();
      setSystemMessage({
        type: 'success',
        text: 'Kontrolli i porosive të vonuara u aktivizua me sukses!'
      });
      // Refresh notifications to show new ones
      fetchNotifications();
    } catch (error) {
      console.error('Error triggering overdue check:', error);
      setSystemMessage({
        type: 'error',
        text: 'Gabim gjatë aktivizimit të kontrollit të porosive të vonuara'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle manual trigger for debt report
  const handleTriggerDebtReport = async () => {
    try {
      setActionLoading('debt');
      await triggerDebtReport();
      setSystemMessage({
        type: 'success',
        text: 'Raporti mujor i borxheve u gjenerua me sukses!'
      });
      // Refresh notifications to show new ones
      fetchNotifications();
    } catch (error) {
      console.error('Error triggering debt report:', error);
      setSystemMessage({
        type: 'error',
        text: 'Gabim gjatë gjenerimit të raportit mujor të borxheve'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle start/stop jobs
  const handleJobsControl = async (action) => {
    try {
      setActionLoading(action);
      if (action === 'start') {
        await startScheduledJobs();
      } else {
        await stopScheduledJobs();
      }
      setSystemMessage({
        type: 'success',
        text: `Punet e planifikuara u ${action === 'start' ? 'nisën' : 'ndalën'} me sukses!`
      });
      // Refresh status after action
      setTimeout(fetchJobsStatus, 1000);
    } catch (error) {
      console.error(`Error ${action}ing jobs:`, error);
      setSystemMessage({
        type: 'error',
        text: `Gabim gjatë ${action === 'start' ? 'nisjes' : 'ndaljes'} së punëve të planifikuara`
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Get job status badge
  const getJobStatusBadge = (job) => {
    if (job.running) {
      return <Badge bg="success"><CheckCircle className="me-1" />Aktiv</Badge>;
    } else {
      return <Badge bg="secondary"><Stop className="me-1" />Ndaluar</Badge>;
    }
  };

  // Get job description
  const getJobDescription = (jobName) => {
    switch (jobName) {
      case 'Daily Overdue Orders Check':
        return 'Kontrollon porositë e vonuara çdo ditë në 12:15 AM';
      case 'Monthly Debt Report':
        return 'Gjeneron raportin mujor të borxheve në fund të çdo muaji';
      case 'Weekly Long-Pending Orders':
        return 'Kontrollon porositë që kanë qenë në proces për më shumë se 1 javë';
      default:
        return 'Punë e planifikuar';
    }
  };

  // Format cron schedule to readable text
  const formatCronSchedule = (schedule) => {
    switch (schedule) {
      case '15 0 * * *':
        return 'Çdo ditë në 12:15 AM';
      case '0 23 28-31 * *':
        return 'Në fund të çdo muaji në 11:00 PM';
      case '0 9 * * 1':
        return 'Çdo të hënë në 9:00 AM';
      default:
        return schedule;
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

  // Load data on component mount
  useEffect(() => {
    fetchNotifications();
    if (isManager) {
      fetchJobsStatus();
    }
  }, [isManager]);

  // Clear system message after 5 seconds
  useEffect(() => {
    if (systemMessage) {
      const timer = setTimeout(() => setSystemMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [systemMessage]);

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

  if (loading && activeTab === 'notifications') {
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
                Njoftimet & Sistemi
              </h2>
              <p className="text-muted mb-0">
                Menaxhoni njoftimet dhe sistemin e planifikimit
              </p>
            </div>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="notifications" title={
          <span>
            <Bell className="me-1" />
            Njoftimet
            {stats.unread > 0 && (
              <Badge bg="danger" className="ms-2">{stats.unread}</Badge>
            )}
          </span>
        }>
          {/* Notifications Content */}
          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div></div>
                <div>
                  <Button 
                    variant="outline-primary" 
                    onClick={handleMarkAllAsRead}
                    disabled={stats.unread === 0}
                    className="me-2"
                  >
                    <CheckAll className="me-1" />
                    Shëno të Gjitha si të Lexuara
                  </Button>
                  <Button variant="outline-secondary" onClick={fetchNotifications}>
                    <Bell className="me-1" />
                    Rifresko
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
                  <small className="text-muted">Totali</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-warning">{stats.unread}</h5>
                  <small className="text-muted">Pa Lexuar</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-danger">{stats.urgent}</h5>
                  <small className="text-muted">Urgjente</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-warning">{stats.warning}</h5>
                  <small className="text-muted">Paralajmërime</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-info">{stats.info}</h5>
                  <small className="text-muted">Informacion</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Të Gjitha</option>
                <option value="unread">Pa Lexuar</option>
                <option value="read">Të Lexuara</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Të Gjitha Llojet</option>
                <option value="urgjent">Urgjente</option>
                <option value="paralajmërim">Paralajmërime</option>
                <option value="informacion">Informacion</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Kërko në njoftimet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
          </Row>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <Card>
              <Card.Body className="text-center text-muted">
                <Bell size={48} className="mb-3 opacity-50" />
                <p>Nuk ka njoftimet që përputhen me filtrat tuaja.</p>
              </Card.Body>
            </Card>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                return (
                  <Card key={notification.id} className={`mb-3 ${!notification.isRead ? 'border-primary' : ''}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <span className="me-2">{typeInfo.icon}</span>
                            <Badge bg={typeInfo.color} className="me-2">
                              {typeInfo.label}
                            </Badge>
                            {!notification.isRead && (
                              <Badge bg="primary">E Re</Badge>
                            )}
                          </div>
                          <p className="mb-2">{notification.message}</p>
                          <small className="text-muted">
                            {new Date(notification.createdAt).toLocaleString('sq-AL')}
                          </small>
                        </div>
                        <div className="d-flex align-items-center">
                          {!notification.isRead && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="me-2"
                            >
                              <Check className="me-1" />
                              Lexuar
                            </Button>
                          )}
                          {canEditOrders && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <Trash />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Tab>

        {isManager && (
          <Tab eventKey="system" title={
            <span>
              <Gear className="me-1" />
              Sistemi
            </span>
          }>
            {/* System Management Content */}
            {systemMessage && (
              <Alert variant={systemMessage.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setSystemMessage(null)}>
                {systemMessage.type === 'success' ? <CheckCircle className="me-2" /> : <ExclamationTriangle className="me-2" />}
                {systemMessage.text}
              </Alert>
            )}

            {systemLoading ? (
              <div className="text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Po ngarkohet...</span>
                </Spinner>
                <p className="mt-2">Po ngarkohet statusi i sistemit...</p>
              </div>
            ) : jobsStatus ? (
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-primary text-white">
                        <InfoCircle className="me-2" />
                        Statusi i Sistemit
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col sm={6}>
                            <div className="mb-3">
                              <strong>Sistemi:</strong>
                              <br />
                              {jobsStatus.initialized ? (
                                <Badge bg="success"><CheckCircle className="me-1" />I Inicializuar</Badge>
                              ) : (
                                <Badge bg="danger"><ExclamationTriangle className="me-1" />Jo i Inicializuar</Badge>
                              )}
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="mb-3">
                              <strong>Punë Aktive:</strong>
                              <br />
                              <Badge bg="info">{jobsStatus.jobs?.filter(job => job.running).length || 0} / {jobsStatus.jobs?.length || 0}</Badge>
                            </div>
                          </Col>
                        </Row>
                        <div className="d-grid gap-2 d-md-flex">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={() => handleJobsControl('start')}
                            disabled={actionLoading === 'start'}
                          >
                            {actionLoading === 'start' ? <Spinner animation="border" size="sm" /> : <Play className="me-1" />}
                            Nis Të Gjitha
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleJobsControl('stop')}
                            disabled={actionLoading === 'stop'}
                          >
                            {actionLoading === 'stop' ? <Spinner animation="border" size="sm" /> : <Stop className="me-1" />}
                            Ndal Të Gjitha
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100">
                      <Card.Header className="bg-success text-white">
                        <ClockHistory className="me-2" />
                        Kontrolle Manuale
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-3">
                          <p className="small text-muted mb-2">Testoni funksionalitetin e njoftimeve pa pritur orën e planifikuar</p>
                          <div className="d-grid gap-2">
                            <Button 
                              variant="warning" 
                              size="sm"
                              onClick={handleTriggerOverdue}
                              disabled={actionLoading === 'overdue'}
                            >
                              {actionLoading === 'overdue' ? <Spinner animation="border" size="sm" /> : <ExclamationTriangle className="me-1" />}
                              Kontrollo Porositë e Vonuara
                            </Button>
                            <Button 
                              variant="info" 
                              size="sm"
                              onClick={handleTriggerDebtReport}
                              disabled={actionLoading === 'debt'}
                            >
                              {actionLoading === 'debt' ? <Spinner animation="border" size="sm" /> : <Calendar2Event className="me-1" />}
                              Gjeneroj Raportin e Borxheve
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Card>
                      <Card.Header className="bg-dark text-white">
                        <Calendar2Event className="me-2" />
                        Punët e Planifikuara
                      </Card.Header>
                      <Card.Body>
                        {jobsStatus.jobs && jobsStatus.jobs.length > 0 ? (
                          <Table responsive striped hover>
                            <thead>
                              <tr>
                                <th>Emri i Punës</th>
                                <th>Përshkrimi</th>
                                <th>Orari</th>
                                <th>Statusi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {jobsStatus.jobs.map((job, index) => (
                                <tr key={index}>
                                  <td><strong>{job.name}</strong></td>
                                  <td className="text-muted">{getJobDescription(job.name)}</td>
                                  <td>
                                    <code>{formatCronSchedule(job.schedule)}</code>
                                  </td>
                                  <td>{getJobStatusBadge(job)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <div className="text-center text-muted py-4">
                            <Calendar2Event size={48} className="mb-3 opacity-50" />
                            <p>Nuk ka punë të planifikuara aktive</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            ) : (
              <Card>
                <Card.Body className="text-center">
                  <Gear size={48} className="mb-3 opacity-50" />
                  <p>Sistemi nuk është aktiv</p>
                  <Button variant="primary" onClick={fetchJobsStatus}>
                    Rifresko Statusin
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Tab>
        )}
      </Tabs>
    </Container>
  );
};

export default NotificationsPage; 