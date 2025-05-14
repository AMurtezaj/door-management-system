import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Badge, Button, Spinner, 
  Tabs, Tab, ListGroup, Alert
} from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  DoorOpen, DoorClosed, LockFill, PeopleFill,
  ClockFill, GearFill, TrashFill, ArrowLeft,
  ExclamationTriangleFill
} from 'react-bootstrap-icons';
import { getDoorById, changeDoorStatus, getDoorLogs } from '../../services/doorService';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import './DoorDetail.css';

const DoorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [door, setDoor] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch door details on component mount
  useEffect(() => {
    fetchDoorDetails();
  }, [id]);
  
  // Fetch logs when activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity' && door) {
      fetchDoorLogs();
    }
  }, [activeTab, door]);
  
  // Fetch door details
  const fetchDoorDetails = async () => {
    setLoading(true);
    try {
      const data = await getDoorById(id);
      setDoor(data);
    } catch (error) {
      console.error('Error fetching door details:', error);
      enqueueSnackbar('Failed to fetch door details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch door logs
  const fetchDoorLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getDoorLogs(id);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching door logs:', error);
      enqueueSnackbar('Failed to fetch door activity logs', { variant: 'error' });
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Handle door status change
  const handleStatusChange = async (newStatus) => {
    try {
      await changeDoorStatus(id, newStatus);
      
      // Update door state with new status
      setDoor(prevDoor => ({ ...prevDoor, status: newStatus }));
      
      enqueueSnackbar(`Door ${newStatus} successfully`, { variant: 'success' });
      
      // Add new log entry
      const newLog = {
        id: Date.now(),
        doorId: id,
        action: `Door ${newStatus}`,
        timestamp: new Date().toISOString(),
        user: 'Current User'
      };
      
      setLogs(prevLogs => [newLog, ...prevLogs]);
    } catch (error) {
      console.error('Error changing door status:', error);
      enqueueSnackbar(`Failed to ${newStatus} door`, { variant: 'error' });
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge bg="success" className="fs-6">Open <DoorOpen className="ms-1" /></Badge>;
      case 'closed':
        return <Badge bg="info" className="fs-6">Closed <DoorClosed className="ms-1" /></Badge>;
      case 'locked':
        return <Badge bg="primary" className="fs-6">Locked <LockFill className="ms-1" /></Badge>;
      case 'alarm':
        return <Badge bg="danger" className="fs-6">Alarm <ExclamationTriangleFill className="ms-1" /></Badge>;
      default:
        return <Badge bg="secondary" className="fs-6">{status}</Badge>;
    }
  };
  
  // Get log icon based on action
  const getLogIcon = (action) => {
    if (action.includes('open')) return <DoorOpen className="text-success" />;
    if (action.includes('close')) return <DoorClosed className="text-info" />;
    if (action.includes('lock')) return <LockFill className="text-primary" />;
    if (action.includes('access') || action.includes('permission')) return <PeopleFill className="text-warning" />;
    if (action.includes('config') || action.includes('setting')) return <GearFill className="text-secondary" />;
    if (action.includes('alarm')) return <ExclamationTriangleFill className="text-danger" />;
    return <ClockFill className="text-secondary" />;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading door details...</p>
      </div>
    );
  }

  if (!door) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Door Not Found</Alert.Heading>
        <p>
          The door you are looking for does not exist or you don't have permission to view it.
        </p>
        <div className="d-flex justify-content-end">
          <Button variant="outline-warning" as={Link} to="/doors">
            Back to Doors
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex align-items-center">
        <Button 
          variant="outline-secondary" 
          className="me-2" 
          as={Link} 
          to="/doors"
        >
          <ArrowLeft /> Back
        </Button>
        <h4 className="mb-0">{door.name}</h4>
      </div>
      
      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white py-3">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="border-bottom-0"
              >
                <Tab eventKey="overview" title="Overview" />
                <Tab eventKey="activity" title="Activity Log" />
                <Tab eventKey="access" title="Access Control" />
              </Tabs>
            </Card.Header>
            
            <Card.Body>
              {activeTab === 'overview' && (
                <div className="door-overview">
                  <Row>
                    <Col md={6}>
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Status</h6>
                        <div className="fs-5">{getStatusBadge(door.status)}</div>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Location</h6>
                        <p className="fs-5">{door.location}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Type</h6>
                        <p className="fs-5">{door.type}</p>
                      </div>
                    </Col>
                    
                    <Col md={6}>
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Last Activity</h6>
                        <p className="fs-5">{new Date(door.lastActivity).toLocaleString()}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Access Level</h6>
                        <p className="fs-5">{door.accessLevel}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h6 className="text-muted mb-2">Created</h6>
                        <p className="fs-5">{new Date(door.createdAt).toLocaleDateString()}</p>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Description</h6>
                    <p>{door.description || 'No description provided.'}</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div className="door-activity">
                  {logsLoading ? (
                    <div className="text-center p-4">
                      <Spinner animation="border" size="sm" role="status" />
                      <p className="mt-2 text-muted">Loading activity logs...</p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted">No activity logs found for this door.</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {logs.map(log => (
                        <ListGroup.Item key={log.id} className="py-3">
                          <div className="d-flex">
                            <div className="log-icon me-3">
                              {getLogIcon(log.action)}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="fw-bold">{log.action}</div>
                                <small className="text-muted">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </small>
                              </div>
                              <div className="log-user text-muted">
                                {log.user}
                              </div>
                              <div className="log-date small text-muted">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </div>
              )}
              
              {activeTab === 'access' && (
                <div className="door-access">
                  <Alert variant={isAdmin ? 'info' : 'warning'}>
                    {isAdmin ? (
                      <>
                        <Alert.Heading>Manage Access Permissions</Alert.Heading>
                        <p>
                          Add or remove users and groups who can access this door.
                          You can set different permission levels for each user.
                        </p>
                        <div className="d-flex justify-content-end">
                          <Button 
                            variant="primary"
                            as={Link}
                            to={`/doors/${id}/access`}
                          >
                            Manage Access
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Alert.Heading>Access Management</Alert.Heading>
                        <p>
                          You need administrator privileges to manage access for this door.
                        </p>
                      </>
                    )}
                  </Alert>
                  
                  <h6 className="mt-4 mb-3">Users with Access</h6>
                  <ListGroup>
                    {door.accessUsers && door.accessUsers.length > 0 ? (
                      door.accessUsers.map(user => (
                        <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <div className="small text-muted">{user.role}</div>
                          </div>
                          <Badge bg="info">{user.accessLevel}</Badge>
                        </ListGroup.Item>
                      ))
                    ) : (
                      <ListGroup.Item className="text-muted">
                        No users have been granted access to this door yet.
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  onClick={() => handleStatusChange('open')}
                  disabled={door.status === 'open'}
                >
                  <DoorOpen className="me-2" /> Open Door
                </Button>
                <Button 
                  variant="info" 
                  onClick={() => handleStatusChange('closed')}
                  disabled={door.status === 'closed'}
                >
                  <DoorClosed className="me-2" /> Close Door
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleStatusChange('locked')}
                  disabled={door.status === 'locked'}
                >
                  <LockFill className="me-2" /> Lock Door
                </Button>
                
                <hr />
                
                {isAdmin && (
                  <>
                    <Button 
                      variant="outline-primary" 
                      as={Link} 
                      to={`/doors/${id}/edit`}
                    >
                      <GearFill className="me-2" /> Edit Door
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this door?')) {
                          // Handle door deletion logic here
                          navigate('/doors');
                        }
                      }}
                    >
                      <TrashFill className="me-2" /> Delete Door
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0">Door Status History</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {/* We'll show the last 5 status changes */}
                {logs
                  .filter(log => log.action.includes('open') || log.action.includes('close') || log.action.includes('lock'))
                  .slice(0, 5)
                  .map(log => (
                    <ListGroup.Item key={log.id} className="py-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {getLogIcon(log.action)}
                        </div>
                        <div>
                          <div className="fw-bold">{log.action}</div>
                          <div className="small text-muted">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                {logs.filter(log => log.action.includes('open') || log.action.includes('close') || log.action.includes('lock')).length === 0 && (
                  <ListGroup.Item className="py-3 text-muted text-center">
                    No status changes recorded yet.
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DoorDetail; 