import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner, Modal, Card } from 'react-bootstrap';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { sq } from 'date-fns/locale';
import { Calendar3, ArrowRepeat } from 'react-bootstrap-icons';
import { 
  getSupplementaryOrdersByParentId, 
  updateSupplementaryOrderPaymentStatus, 
  deleteSupplementaryOrder 
} from '../../services/supplementaryOrderService';
import { getAllOrders } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import SupplementaryOrderInvoice from './SupplementaryOrderInvoice';

const AdditionalOrdersPage = () => {
  const [supplementaryOrders, setSupplementaryOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [parentOrders, setParentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, inProcess, completed, debt, unpaid
  const [searchTerm, setSearchTerm] = useState('');
  
  // Time filtering state
  const [timeFilter, setTimeFilter] = useState('currentWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const { isAuthenticated, user } = useAuth();
  
  // Print invoice state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSupplementaryOrder, setSelectedSupplementaryOrder] = useState(null);
  const [selectedParentOrder, setSelectedParentOrder] = useState(null);
  
  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Apply filtering and sorting when data changes
  useEffect(() => {
    filterAndSortOrders();
  }, [supplementaryOrders, filter, searchTerm, timeFilter, customStartDate, customEndDate, sortOrder]);
  
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all main orders to find garage door orders
      const allOrders = await getAllOrders();
      const garageDoorOrders = allOrders.filter(order => order.tipiPorosise === 'derë garazhi');
      setParentOrders(garageDoorOrders);
      
      // Then get all supplementary orders for these garage door orders
      const allSupplementaryOrders = [];
      for (const order of garageDoorOrders) {
        try {
          const response = await getSupplementaryOrdersByParentId(order.id);
          if (response.data && response.data.length > 0) {
            // Add parent order info to each supplementary order
            const ordersWithParent = response.data.map(suppOrder => ({
              ...suppOrder,
              parentOrderInfo: order
            }));
            allSupplementaryOrders.push(...ordersWithParent);
          }
        } catch (err) {
          // Continue if no supplementary orders for this parent
          console.log(`No supplementary orders for parent ${order.id}`);
        }
      }
      
      setSupplementaryOrders(allSupplementaryOrders);
    } catch (err) {
      console.error('Error fetching additional orders:', err);
      setError(`Ka ndodhur një gabim gjatë marrjes së porosive shtesë: ${err.message || 'Gabim i panjohur'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...supplementaryOrders];
    const today = new Date();
    
    // Apply time filter first (based on parent order delivery date)
    switch (timeFilter) {
      case 'currentWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: weekStart, end: weekEnd });
        });
        break;
        
      case 'currentMonth':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: monthStart, end: monthEnd });
        });
        break;
        
      case 'nextWeek':
        const nextWeekStart = startOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: nextWeekStart, end: nextWeekEnd });
        });
        break;
        
      case 'nextMonth':
        const nextMonthStart = startOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        const nextMonthEnd = endOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        filtered = filtered.filter(order => {
          if (!order.parentOrderInfo?.dita) return false;
          const orderDate = parseISO(order.parentOrderInfo.dita);
          return isWithinInterval(orderDate, { start: nextMonthStart, end: nextMonthEnd });
        });
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = parseISO(customStartDate);
          const end = parseISO(customEndDate);
          filtered = filtered.filter(order => {
            if (!order.parentOrderInfo?.dita) return false;
            const orderDate = parseISO(order.parentOrderInfo.dita);
            return isWithinInterval(orderDate, { start, end });
          });
        }
        break;
        
      case 'all':
      default:
        // No time filtering
        break;
    }
    
    // Apply status filter
    if (filter === 'inProcess') {
      filtered = filtered.filter(order => order.statusi === 'në proces');
    } else if (filter === 'completed') {
      filtered = filtered.filter(order => order.statusi === 'e përfunduar');
    } else if (filter === 'debt') {
      filtered = filtered.filter(order => order.statusi === 'borxh');
    } else if (filter === 'unpaid') {
      filtered = filtered.filter(order => !order.isPaymentDone);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.numriTelefonit.includes(searchTerm) ||
        order.vendi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pershkrimiProduktit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.kaparaReceiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.parentOrderId.toString().includes(searchTerm)
      );
    }

    // Apply sorting by parent order delivery date
    const sorted = filtered.sort((a, b) => {
      const dateA = a.parentOrderInfo?.dita ? new Date(a.parentOrderInfo.dita) : new Date(0);
      const dateB = b.parentOrderInfo?.dita ? new Date(b.parentOrderInfo.dita) : new Date(0);
      
      return sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });
    
    setFilteredOrders(sorted);
  };

  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    if (newFilter !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const getFilterDescription = () => {
    const today = new Date();
    
    switch (timeFilter) {
      case 'currentWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return `Java aktuale (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`;
        
      case 'currentMonth':
        return `Muaji aktual (${format(today, 'MMMM yyyy', { locale: sq })})`;
        
      case 'nextWeek':
        const nextWeekStart = startOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        return `Java e ardhshme (${format(nextWeekStart, 'dd/MM')} - ${format(nextWeekEnd, 'dd/MM')})`;
        
      case 'nextMonth':
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return `Muaji i ardhshëm (${format(nextMonth, 'MMMM yyyy', { locale: sq })})`;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          return `Interval i zgjedhur (${format(parseISO(customStartDate), 'dd/MM/yyyy')} - ${format(parseISO(customEndDate), 'dd/MM/yyyy')})`;
        }
        return 'Interval i personalizuar';
        
      case 'all':
      default:
        return 'Të gjitha porositë shtesë';
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handlePaymentUpdate = async (id, isPaid) => {
    try {
      setError('');
      await updateSupplementaryOrderPaymentStatus(id, isPaid);
      
      // Update the order in the state
      setSupplementaryOrders(orders => 
        orders.map(order => 
          order.id === id ? { 
            ...order, 
            isPaymentDone: isPaid,
            statusi: isPaid ? 'e përfunduar' : 'borxh'
          } : order
        )
      );
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Ka ndodhur një gabim gjatë përditësimit të statusit të pagesës: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të fshini këtë porosi shtesë?')) {
      return;
    }
    
    try {
      setError('');
      await deleteSupplementaryOrder(id);
      
      // Remove the order from the state
      setSupplementaryOrders(orders => orders.filter(order => order.id !== id));
    } catch (err) {
      console.error('Error deleting supplementary order:', err);
      setError(`Ka ndodhur një gabim gjatë fshirjes së porosisë shtesë: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handlePrintInvoice = (supplementaryOrder) => {
    setSelectedSupplementaryOrder(supplementaryOrder);
    setSelectedParentOrder(supplementaryOrder.parentOrderInfo);
    setShowPrintModal(true);
  };
  
  const getStatusBadge = (status) => {
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
  
  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Duke ngarkuar porositë shtesë...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Porositë Shtesë</h2>
        <Button variant="outline-primary" onClick={fetchAllData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
        </Button>
      </div>

      {/* Time Filter Controls */}
      <Card className="mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <Calendar3 className="me-2 text-primary" size={20} />
                  <strong>Filtro sipas kohës (data e dorëzimit të porosisë kryesore):</strong>
                </div>
                
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant={timeFilter === 'currentWeek' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('currentWeek')}
                  >
                    Java Aktuale
                  </Button>
                  <Button
                    variant={timeFilter === 'nextWeek' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('nextWeek')}
                  >
                    Java e Ardhshme
                  </Button>
                  <Button
                    variant={timeFilter === 'currentMonth' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('currentMonth')}
                  >
                    Muaji Aktual
                  </Button>
                  <Button
                    variant={timeFilter === 'nextMonth' ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('nextMonth')}
                  >
                    Muaji i Ardhshëm
                  </Button>
                  <Button
                    variant={timeFilter === 'custom' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('custom')}
                  >
                    Interval i Personalizuar
                  </Button>
                  <Button
                    variant={timeFilter === 'all' ? 'warning' : 'outline-warning'}
                    size="sm"
                    onClick={() => handleTimeFilterChange('all')}
                  >
                    Të Gjitha
                  </Button>
                </div>
              </div>
              
              {/* Custom Date Range */}
              {timeFilter === 'custom' && (
                <Row className="mt-3">
                  <Col md={4}>
                    <Form.Label className="small">Data e fillimit:</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small">Data e mbarimit:</Form.Label>
                    <Form.Control
                      type="date"
                      size="sm"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </Col>
                </Row>
              )}
              
              {/* Filter Description */}
              <div className="mt-2">
                <Badge bg="info" className="me-2">
                  {filteredOrders.length} porosi shtesë
                </Badge>
                <small className="text-muted">
                  Duke shfaqur: <strong>{getFilterDescription()}</strong>
                </small>
              </div>
            </Col>
            
            <Col md={4} className="text-end">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={toggleSortOrder}
              >
                <ArrowRepeat className="me-2" size={16} />
                {sortOrder === 'desc' ? 'Më të vjetrat para' : 'Më të rejat para'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setError('');
                fetchAllData();
              }}
            >
              Provo përsëri
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Kërko sipas emrit, telefonit ose përshkrimit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Të Gjitha Statuset</option>
            <option value="inProcess">Në Proces</option>
            <option value="completed">Të Përfunduara</option>
            <option value="debt">Borxhe</option>
            <option value="unpaid">Të Papaguara</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID Shtesë</th>
            <th>ID Kryesore</th>
            <th>Klienti</th>
            <th>Produkti</th>
            <th>Çmimi</th>
            <th>Statusi</th>
            <th>Data e Dorëzimit (Kryesore)</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>#{order.parentOrderId}</td>
              <td>
                <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br/>
                <small className="text-muted">{order.numriTelefonit}</small><br/>
                <small className="text-muted">{order.vendi}</small>
              </td>
              <td>
                <div title={order.pershkrimiProduktit}>
                  {order.pershkrimiProduktit?.length > 50 
                    ? `${order.pershkrimiProduktit.substring(0, 50)}...` 
                    : order.pershkrimiProduktit}
                </div>
              </td>
              <td>
                {parseFloat(order.cmimiTotal).toFixed(2)} €<br/>
                <small>
                  {order.isPaymentDone ? 
                    <Badge bg="success">Paguar</Badge> : 
                    <Badge bg="danger">Papaguar: {(parseFloat(order.cmimiTotal) - parseFloat(order.kaparja || 0)).toFixed(2)} €</Badge>
                  }
                </small>
              </td>
              <td>{getStatusBadge(order.statusi)}</td>
              <td>
                {order.parentOrderInfo?.dita ? 
                  format(new Date(order.parentOrderInfo.dita), 'dd/MM/yyyy') : 
                  <span className="text-muted">Pa datë</span>
                }
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {!order.isPaymentDone && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, true)}
                    >
                      Paguaj
                    </Button>
                  )}
                  
                  {order.isPaymentDone && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, false)}
                    >
                      Anulo Pagesën
                    </Button>
                  )}
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handlePrintInvoice(order)}
                  >
                    Printo
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(order.id)}
                  >
                    Fshi
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          
          {filteredOrders.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center py-4">
                {timeFilter !== 'all' ? 
                  <>
                    Nuk ka porosi shtesë për {getFilterDescription().toLowerCase()}
                    <div className="mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleTimeFilterChange('all')}
                      >
                        Shiko të gjitha porositë shtesë
                      </Button>
                    </div>
                  </> :
                  (searchTerm || filter !== 'all' ? 
                    'Nuk u gjetën porosi shtesë me kriteret e zgjedhura' : 
                    'Nuk ka porosi shtesë të regjistruara')
                }
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Print Invoice Modal */}
      <SupplementaryOrderInvoice 
        show={showPrintModal} 
        onHide={() => setShowPrintModal(false)} 
        supplementaryOrder={selectedSupplementaryOrder}
        parentOrder={selectedParentOrder}
      />
    </Container>
  );
};

export default AdditionalOrdersPage; 