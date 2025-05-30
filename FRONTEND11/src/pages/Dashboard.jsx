import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, Spinner, Alert, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DoorOpen, DoorClosed, LockFill, ExclamationTriangleFill,
  PeopleFill, ClockHistory, Bell, Calendar3, Cart, CurrencyDollar, People
} from 'react-bootstrap-icons';
import { getAllDoors } from '../services/doorService';
import { getAllNotifications } from '../services/notificationService';
import { getAllOrders, getDebtStatistics } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import CapacityCalendar from '../components/orders/CapacityCalendar';
import NotificationDebug from '../components/debug/NotificationDebug';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [doors, setDoors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [debtStats, setDebtStats] = useState({
    cashDebtCount: 0,
    bankDebtCount: 0,
    totalDebtCount: 0,
    totalCashDebt: 0,
    totalBankDebt: 0,
    totalDebt: 0
  });
  const [doorsLoading, setDoorsLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDoors();
      fetchNotifications();
      fetchOrders();
      fetchDebtStats();
    } else {
      setDoorsLoading(false);
      setNotificationsLoading(false);
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);
  
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
  
  // Fetch recent orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const data = await getAllOrders();
      setOrders(data.slice(0, 5)); // Get only the 5 most recent
      setOrdersLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersLoading(false);
    }
  };
  
  // Fetch debt statistics
  const fetchDebtStats = async () => {
    try {
      const data = await getDebtStatistics();
      setDebtStats(data);
    } catch (error) {
      console.error('Error fetching debt statistics:', error);
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
  
  // Get door status badge
  const getDoorStatusBadge = (status) => {
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
  
  // Get order status badge
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'në proces':
        return <Badge bg="warning">Në Proces</Badge>;
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'borxh':
        return <Badge bg="danger">Borxh</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard">
        <Card>
          <Card.Body className="text-center p-5">
            <h3>Mirë se vini në Sistemin e Menaxhimit të Dyerve</h3>
            <Alert variant="info" className="my-4">
              Ju duhet të jeni të loguar për të parë përmbajtjen e panelit kryesor.
            </Alert>
            <Button onClick={() => navigate('/login')} size="lg" variant="primary">
              Logohu tani
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Dashboard</h2>
          <p className="text-muted">Welcome back, {user?.emri}! Here's an overview of your door management system.</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="dashboard-stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-primary text-primary me-3">
                <Cart size={24} />
              </div>
              <div>
                <div className="stat-label">Porosi Totale</div>
                <h4 className="stat-value text-primary">{orders.length}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-warning text-warning me-3">
                <CurrencyDollar size={24} />
              </div>
              <div>
                <div className="stat-label">Borxhe (Kesh)</div>
                <h4 className="stat-value text-warning">{debtStats.totalCombinedCashDebt?.toFixed(2) || '0.00'}€</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-info text-info me-3">
                <People size={24} />
              </div>
              <div>
                <div className="stat-label">Borxhe (Bankë)</div>
                <h4 className="stat-value text-info">{debtStats.totalCombinedBankDebt?.toFixed(2) || '0.00'}€</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="dashboard-stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon bg-light-danger text-danger me-3">
                <ExclamationTriangleFill size={24} />
              </div>
              <div>
                <div className="stat-label">Borxhe Totale</div>
                <h4 className="stat-value text-danger">{(debtStats.totalCombinedCashDebt + debtStats.totalCombinedBankDebt)?.toFixed(2) || '0.00'}€</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col lg={7} className="mb-4">
          <CapacityCalendar />
        </Col>
        
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <Calendar3 className="me-2" />
                <h5 className="mb-0">Porositë e Fundit</h5>
              </div>
              <Link to="/orders" className="btn btn-sm btn-outline-primary">
                Shiko Të Gjitha
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {ordersLoading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status" />
                  <p className="mt-2 text-muted">Duke ngarkuar porositë...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">Nuk u gjetën porosi.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Klienti</th>
                        <th>Tipi</th>
                        <th>Çmimi</th>
                        <th>Statusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <Link to={`/orders/edit/${order.id}`} className="text-decoration-none">
                              {order.emriKlientit} {order.mbiemriKlientit}
                            </Link>
                          </td>
                          <td>{order.tipiPorosise}</td>
                          <td>{parseFloat(order.cmimiTotal).toFixed(2)} €</td>
                          <td>{getOrderStatusBadge(order.statusi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 