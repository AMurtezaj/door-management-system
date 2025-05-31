import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Table, Spinner, Alert, Button, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DoorOpen, DoorClosed, LockFill, ExclamationTriangleFill,
  PeopleFill, ClockHistory, Bell, Calendar3, Cart, CurrencyDollar, People,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown
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
      <div className="dashboard-container">
        <div className="unauthenticated-card">
          <div className="welcome-icon">
            <DoorClosed size={48} />
          </div>
          <h3>Mirë se vini në Sistemin e Menaxhimit të Dyerve</h3>
          <Alert variant="info" className="welcome-alert">
            Ju duhet të jeni të loguar për të parë përmbajtjen e panelit kryesor.
          </Alert>
          <Button onClick={() => navigate('/login')} size="lg" className="login-btn">
            Logohu tani
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Mirë se erdhët, {user?.emri}! Këtu është një përmbledhje e sistemit tuaj të menaxhimit të dyerve.</p>
          </div>
          <div className="quick-actions">
            <Button variant="outline-primary" size="sm" onClick={() => navigate('/orders/new')}>
              <Cart className="me-1" size={16} />
              Porosi e Re
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="stats-row g-4 mb-5">
        <Col md={6} lg={3}>
          <div className="modern-stat-card orders-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-number">{orders.length}</h3>
                <p className="stat-label">Porosi Totale</p>
              </div>
              <div className="stat-icon-container">
                <Cart className="stat-icon" />
              </div>
            </div>
            <div className="stat-footer">
              <div className="trend positive">
                <TrendingUp size={16} />
                <span>+12% këtë muaj</span>
              </div>
            </div>
          </div>
        </Col>
        
        <Col md={6} lg={3}>
          <div className="modern-stat-card cash-debt-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-number">{debtStats.totalCombinedCashDebt?.toFixed(2) || '0.00'}€</h3>
                <p className="stat-label">Borxhe (Kesh)</p>
              </div>
              <div className="stat-icon-container">
                <CurrencyDollar className="stat-icon" />
              </div>
            </div>
            <div className="stat-footer">
              <div className="trend negative">
                <TrendingDown size={16} />
                <span>-5% këtë javë</span>
              </div>
            </div>
          </div>
        </Col>
        
        <Col md={6} lg={3}>
          <div className="modern-stat-card bank-debt-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-number">{debtStats.totalCombinedBankDebt?.toFixed(2) || '0.00'}€</h3>
                <p className="stat-label">Borxhe (Bankë)</p>
              </div>
              <div className="stat-icon-container">
                <People className="stat-icon" />
              </div>
            </div>
            <div className="stat-footer">
              <div className="trend neutral">
                <span>Pa ndryshim</span>
              </div>
            </div>
          </div>
        </Col>
        
        <Col md={6} lg={3}>
          <div className="modern-stat-card total-debt-card">
            <div className="stat-content">
              <div className="stat-info">
                <h3 className="stat-number">{(debtStats.totalCombinedCashDebt + debtStats.totalCombinedBankDebt)?.toFixed(2) || '0.00'}€</h3>
                <p className="stat-label">Borxhe Totale</p>
              </div>
              <div className="stat-icon-container">
                <ExclamationTriangleFill className="stat-icon" />
              </div>
            </div>
            <div className="stat-footer">
              <div className="trend warning">
                <ArrowUp size={16} />
                <span>Kërkon vëmendje</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      
      <Row className="main-content-row g-4">
        <Col lg={8} className="mb-4">
          <div className="calendar-container">
            <CapacityCalendar />
          </div>
        </Col>
        
        <Col lg={4} className="mb-4">
          <div className="orders-table-container">
            <div className="section-header">
              <div className="header-left">
                <Calendar3 className="section-icon" />
                <h5 className="section-title">Porositë e Fundit</h5>
              </div>
              <Link to="/orders" className="view-all-btn">
                Shiko Të Gjitha
              </Link>
            </div>
            <div className="table-container">
              {ordersLoading ? (
                <div className="loading-state">
                  <Spinner animation="border" size="sm" />
                  <p>Duke ngarkuar porositë...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <Cart size={32} className="empty-icon" />
                  <p>Nuk u gjetën porosi.</p>
                </div>
              ) : (
                <div className="modern-table-wrapper">
                  <Table hover className="modern-table">
                    <thead>
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
                            <Link to={`/orders/edit/${order.id}`} className="client-link">
                              <div className="client-info">
                                <div className="client-avatar">
                                  {order.emriKlientit?.charAt(0)}{order.mbiemriKlientit?.charAt(0)}
                                </div>
                                <span>{order.emriKlientit} {order.mbiemriKlientit}</span>
                              </div>
                            </Link>
                          </td>
                          <td><span className="order-type">{order.tipiPorosise}</span></td>
                          <td><span className="price">{parseFloat(order.cmimiTotal).toFixed(2)} €</span></td>
                          <td>{getOrderStatusBadge(order.statusi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 