import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Dropdown, Badge, ListGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { format, parseISO, isAfter, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { sq } from 'date-fns/locale';
import { 
  Calendar3, 
  Plus, 
  BarChart, 
  Clock,
  Pencil,
  Trash,
  Eye,
  ArrowRepeat,
  CalendarCheck,
  Phone,
  GeoAlt,
  DoorOpen,
  CurrencyEuro,
  Person,
  CheckCircleFill,
  ExclamationTriangleFill,
  InfoCircle
} from 'react-bootstrap-icons';
import { getAllCapacities, setCapacity, deleteCapacity } from '../../services/capacityService';
import { getOrdersByDay } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import useOrderManagement from '../../hooks/useOrderManagement';
import './capacity.css';

const CapacityManagement = () => {
  const { canManageCapacities } = useAuth();
  const [capacities, setCapacities] = useState([]);
  const [filteredCapacities, setFilteredCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [capacityToDelete, setCapacityToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // Show current week first
  
  // New filter state
  const [timeFilter, setTimeFilter] = useState('currentWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Orders modal state
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [ordersForDate, setOrdersForDate] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Individual order details modal state
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Use order management hook for consistent data and status logic
  const {
    orders,
    getOrdersForDay,
    getDayStatus
  } = useOrderManagement();
  
  const [formData, setFormData] = useState({
    dita: format(new Date(), 'yyyy-MM-dd'),
    dyerGarazhi: '',
    kapake: ''
  });
  
  // Fetch all capacities
  useEffect(() => {
    fetchCapacities();
  }, []);
  
  // Apply filtering and sorting when capacities, filter, or sort order changes
  useEffect(() => {
    filterAndSortCapacities();
  }, [capacities, timeFilter, customStartDate, customEndDate, sortOrder]);
  
  const fetchCapacities = async () => {
    try {
      setLoading(true);
      const data = await getAllCapacities();
      setCapacities(data);
      setLoading(false);
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë marrjes së kapaciteteve');
      setLoading(false);
    }
  };
  
  const filterAndSortCapacities = () => {
    let filtered = [...capacities];
    const today = new Date();
    
    // Apply time filter
    switch (timeFilter) {
      case 'currentWeek':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        filtered = filtered.filter(capacity => {
          const capacityDate = parseISO(capacity.dita);
          return isWithinInterval(capacityDate, { start: weekStart, end: weekEnd });
        });
        break;
        
      case 'currentMonth':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        filtered = filtered.filter(capacity => {
          const capacityDate = parseISO(capacity.dita);
          return isWithinInterval(capacityDate, { start: monthStart, end: monthEnd });
        });
        break;
        
      case 'nextWeek':
        const nextWeekStart = startOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
        filtered = filtered.filter(capacity => {
          const capacityDate = parseISO(capacity.dita);
          return isWithinInterval(capacityDate, { start: nextWeekStart, end: nextWeekEnd });
        });
        break;
        
      case 'nextMonth':
        const nextMonthStart = startOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        const nextMonthEnd = endOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1));
        filtered = filtered.filter(capacity => {
          const capacityDate = parseISO(capacity.dita);
          return isWithinInterval(capacityDate, { start: nextMonthStart, end: nextMonthEnd });
        });
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = parseISO(customStartDate);
          const end = parseISO(customEndDate);
          filtered = filtered.filter(capacity => {
            const capacityDate = parseISO(capacity.dita);
            return isWithinInterval(capacityDate, { start, end });
          });
        }
        break;
        
      case 'all':
      default:
        // No filtering, show all
        break;
    }
    
    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.dita);
      const dateB = new Date(b.dita);
      
      return sortOrder === 'asc' 
        ? dateA - dateB  // Oldest first
        : dateB - dateA; // Newest first
    });
    
    setFilteredCapacities(sorted);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
        return 'Të gjitha kapacitetet';
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate fields
    if (formData.dyerGarazhi === '' || formData.kapake === '') {
      setError('Ju lutem plotësoni të gjitha fushat e detyrueshme!');
      return;
    }
    
    try {
      const data = await setCapacity(formData);
      
      // Update capacities list
      let updatedCapacities = [...capacities];
      const existingIndex = updatedCapacities.findIndex(c => c.dita === formData.dita);
      
      if (existingIndex !== -1) {
        // Update existing capacity
        updatedCapacities[existingIndex] = data;
      } else {
        // Add new capacity
        updatedCapacities.push(data);
      }
      
      setCapacities(updatedCapacities);
      
      setSuccess('Kapaciteti u ruajt me sukses!');
      
      // Reset form
      setFormData({
        dita: format(new Date(), 'yyyy-MM-dd'),
        dyerGarazhi: '',
        kapake: ''
      });
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë ruajtjes së kapacitetit');
    }
  };
  
  const handleEdit = (capacity) => {
    setFormData({
      dita: capacity.dita,
      dyerGarazhi: capacity.dyerGarazhi,
      kapake: capacity.kapake
    });
  };
  
  const handleDeleteClick = (capacity) => {
    setCapacityToDelete(capacity);
    setShowDeleteModal(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await deleteCapacity(capacityToDelete.id);
      
      // Update capacities list
      const updatedCapacities = capacities.filter(c => c.id !== capacityToDelete.id);
      setCapacities(updatedCapacities);
      
      setSuccess('Kapaciteti u fshi me sukses!');
      setShowDeleteModal(false);
      setCapacityToDelete(null);
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë fshirjes së kapacitetit');
      setShowDeleteModal(false);
    }
  };
  
  const handleViewOrders = async (date) => {
    setSelectedDate(date);
    setLoadingOrders(true);
    setShowOrdersModal(true);
    
    try {
      const parsedDate = parseISO(date);
      const dayOrders = getOrdersForDay(parsedDate);
      setOrdersForDate(dayOrders);
    } catch (err) {
      console.error('Error fetching orders for date:', err);
      setOrdersForDate([]);
    } finally {
      setLoadingOrders(false);
    }
  };
  
  const getStatusBadge = (order) => {
    if (!order.OrderDetail) return <Badge bg="secondary">Pa status</Badge>;
    
    const status = order.OrderDetail.statusi;
    const isPaymentDone = order.Payment?.isPaymentDone;
    
    switch (status) {
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'në proces':
        return <Badge bg="warning">Në Proces</Badge>;
      case 'borxh':
        return <Badge bg="danger">Borxh</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // Enhanced capacity squares with order status colors and click functionality
  const renderCapacitySquares = (capacity, type) => {
    const date = parseISO(capacity.dita);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayOrders = getOrdersForDay(date);
    const today = new Date();
    const isPastDate = isAfter(today, date);
    
    // Filter orders by type
    const ordersForType = dayOrders.filter(order => {
      if (type === 'dyerGarazhi') {
        return order.tipiPorosise === 'derë garazhi';
      } else if (type === 'kapake') {
        return order.tipiPorosise === 'kapak';
      }
      return false;
    });
    
    const totalCapacity = capacity[type] || 0;
    const usedSlots = ordersForType.length;
    const availableSlots = Math.max(0, totalCapacity - usedSlots);
    
    const squares = [];
    
    // Render order squares with status colors
    ordersForType.forEach((order, index) => {
      let squareClass = 'capacity-square';
      let tooltipText = '';
      let bgColor = '';
      
      const isCompleted = order.statusi === 'e përfunduar';
      const isOverdue = isPastDate && !isCompleted;
      
      if (isCompleted) {
        squareClass += ' completed';
        bgColor = '#28a745'; // Green for completed
        tooltipText = `✓ ${order.emriKlientit} ${order.mbiemriKlientit} - E përfunduar`;
      } else if (isOverdue) {
        squareClass += ' overdue'; 
        bgColor = '#fd7e14'; // Orange for overdue
        tooltipText = `⚠ ${order.emriKlientit} ${order.mbiemriKlientit} - E vonuar`;
      } else {
        squareClass += ' scheduled';
        bgColor = '#dc3545'; // Red for scheduled
        tooltipText = `📅 ${order.emriKlientit} ${order.mbiemriKlientit} - E planifikuar`;
      }
      
      const square = (
        <OverlayTrigger
          key={`${type}-order-${order.id}`}
          placement="top"
          overlay={
            <Tooltip>
              <div style={{ textAlign: 'left' }}>
                <strong>{tooltipText}</strong><br />
                <small>📞 {order.numriTelefonit}</small><br />
                <small>📍 {order.vendi}</small><br />
                <small>💰 {order.cmimiTotal}€</small><br />
                <small style={{ opacity: 0.8 }}>Kliko për detaje</small>
              </div>
            </Tooltip>
          }
        >
          <div 
            className={`${squareClass} clickable`}
            style={{ 
              backgroundColor: bgColor,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onClick={() => handleOrderClick(order)}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            {/* Status indicator icon */}
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              color: 'white',
              fontSize: '8px',
              fontWeight: 'bold'
            }}>
              {isCompleted ? '✓' : isOverdue ? '⚠' : '•'}
            </div>
          </div>
        </OverlayTrigger>
      );
      
      squares.push(square);
    });
    
    // Render available slots
    for (let i = 0; i < availableSlots; i++) {
      squares.push(
        <OverlayTrigger
          key={`${type}-available-${i}`}
          placement="top"
          overlay={
            <Tooltip>
              <div>
                <strong>Slot i disponueshëm</strong><br />
                <small>Klikoni "👁 Shiko Porositë" për të shtuar porosinë</small>
              </div>
            </Tooltip>
          }
        >
          <div 
            className="capacity-square available"
            style={{
              backgroundColor: '#28a745',
              opacity: 0.6,
              cursor: 'help'
            }}
          />
        </OverlayTrigger>
      );
    }
    
    return (
      <div className="d-flex gap-1 flex-wrap align-items-center">
        {squares}
        {squares.length === 0 && (
          <small className="text-muted">Nuk ka kapacitet</small>
        )}
        {squares.length > 0 && (
          <small className="text-muted ms-2">
            {usedSlots}/{totalCapacity} të rezervuar
          </small>
        )}
      </div>
    );
  };
  
  // Handle clicking on individual order squares
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };
  
  // Helper function to get the day of the week in Albanian
  const getAlbanianDayOfWeek = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE', { locale: sq });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  return (
    <Container className="py-4">
      {/* Page Title */}
      <h2 className="mb-4">Menaxhimi i kapacitetit ditor</h2>

      {/* Time Filter Controls */}
      <Card className="mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <Calendar3 className="me-2 text-primary" size={20} />
                  <strong>Filtro sipas kohës:</strong>
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
                  {filteredCapacities.length} kapacitete
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
                className="modern-btn-outline"
              >
                <ArrowRepeat className="me-2" size={16} />
                {sortOrder === 'desc' ? 'Më të vjetrat para' : 'Më të rejat para'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Color Legend Information Card */}
      <Card className="mb-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <Card.Body className="py-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <InfoCircle className="me-2 text-primary" size={20} />
              <strong className="me-3">Legjenda e Ngjyrave:</strong>
            </div>
            <div className="d-flex flex-wrap gap-3">
              <div className="d-flex align-items-center">
                <div className="capacity-square scheduled me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>E planifikuar</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="capacity-square overdue me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>E vonuar</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="capacity-square completed me-2" style={{ width: '16px', height: '16px' }}></div>
                <small>E përfunduar</small>
              </div>
              <div className="d-flex align-items-center">
                <div className="capacity-square available me-2" style={{ width: '16px', height: '16px', opacity: '0.6' }}></div>
                <small>E disponueshme</small>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <small className="text-muted">
              💡 <strong>Këshillë:</strong> Klikoni në çdo katror të ngjyrosur për të parë detajet e porosisë së atij seksioni.
            </small>
          </div>
        </Card.Body>
      </Card>

      {/* Alert Messages */}
      {error && (
        <Alert variant="danger" className="modern-alert alert-danger">
          <strong>Gabim!</strong> {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="modern-alert alert-success">
          <strong>Sukses!</strong> {success}
        </Alert>
      )}
      
      {!canManageCapacities && (
        <Alert variant="info" className="modern-alert alert-info mb-4">
          <strong>Njoftim:</strong> Si menaxher, ju mund të shikoni kapacitetet dhe porositë, por nuk mund të bëni ndryshime në kapacitete. Vetëm administratori mund të menaxhojë kapacitetet ditore.
        </Alert>
      )}

      {/* Capacity Form */}
      {canManageCapacities && (
        <Card className="capacity-form-card mb-4">
          <Card.Header className="capacity-form-header">
            <div className="d-flex align-items-center">
              <Plus className="me-2" size={20} />
              <h5 className="mb-0">Shto/Ndrysho Kapacitet</h5>
            </div>
          </Card.Header>
          <Card.Body className="capacity-form-body">
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={4}>
                  <div className="modern-form-group">
                    <Form.Label className="modern-label">
                      <Calendar3 className="me-2" size={16} />
                      Dita <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="dita"
                      value={formData.dita}
                      onChange={handleChange}
                      className="modern-input"
                      required
                    />
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="modern-form-group">
                    <Form.Label className="modern-label">
                      <DoorOpen className="me-2" size={16} />
                      Dyer Garazhi <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="dyerGarazhi"
                      value={formData.dyerGarazhi}
                      onChange={handleChange}
                      min="0"
                      placeholder="Vendosni numrin e dyerve të disponueshme"
                      className="modern-input"
                      required
                    />
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="modern-form-group">
                    <Form.Label className="modern-label">
                      <BarChart className="me-2" size={16} />
                      Kapgjik <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="kapake"
                      value={formData.kapake}
                      onChange={handleChange}
                      min="0"
                      placeholder="Vendosni numrin e kapgjikëve të disponueshëm"
                      className="modern-input"
                      required
                    />
                  </div>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-4">
                <Button type="submit" className="modern-btn-primary">
                  <Plus className="me-2" size={18} />
                  Ruaj Kapacitetin
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Capacities Table */}
      <Card className="capacity-table-card">
        <Card.Header className="capacity-table-header">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <BarChart className="me-2" size={20} />
              <h5 className="mb-0">Kapacitetet e Konfiguruara</h5>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Duke ngarkuar...</span>
              </div>
              <p className="mt-3 text-muted">Duke ngarkuar kapacitetet...</p>
            </div>
          ) : filteredCapacities.length > 0 ? (
            <div className="table-responsive">
              <Table className="modern-table mb-0">
                <thead>
                  <tr>
                    <th>Dita</th>
                    <th>Dita e Javës</th>
                    <th>Dyer Garazhi</th>
                    <th>Kapgjik</th>
                    <th>Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCapacities.map(capacity => (
                    <tr key={capacity.id || capacity.dita}>
                      <td>
                        <div className="date-cell">
                          <Calendar3 className="me-2 text-muted" size={16} />
                          <strong>{format(new Date(capacity.dita), 'dd/MM/yyyy')}</strong>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="day-badge">
                          {getAlbanianDayOfWeek(capacity.dita)}
                        </Badge>
                      </td>
                      <td>
                        <div className="capacity-cell">
                          <div className="capacity-number">
                            <DoorOpen className="me-2 text-primary" size={16} />
                            <strong>{capacity.dyerGarazhi}</strong>
                          </div>
                          <div className="capacity-visual mt-2">
                            {renderCapacitySquares(capacity, 'dyerGarazhi')}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="capacity-cell">
                          <div className="capacity-number">
                            <BarChart className="me-2 text-success" size={16} />
                            <strong>{capacity.kapake}</strong>
                          </div>
                          <div className="capacity-visual mt-2">
                            {renderCapacitySquares(capacity, 'kapake')}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewOrders(capacity.dita)}
                            className="modern-btn-info"
                            title="Shiko porositë"
                          >
                            <Calendar3 size={14} />
                          </Button>
                          {canManageCapacities && (
                            <>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleEdit(capacity)}
                                className="modern-btn-warning"
                                title="Ndrysho"
                              >
                                <BarChart size={14} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteClick(capacity)}
                                className="modern-btn-danger"
                                title="Fshi"
                              >
                                <Trash size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="empty-state">
              <Calendar3 size={48} className="text-muted mb-3" />
              <h5>
                {timeFilter === 'all' ? 'Nuk ka kapacitete të konfiguruar' : 'Nuk ka kapacitete për këtë periudhë'}
              </h5>
              <p className="text-muted">
                {timeFilter === 'all' 
                  ? 'Ju lutem shtoni një kapacitet të ri për të filluar.'
                  : `Nuk ka kapacitete të konfiguruar për ${getFilterDescription().toLowerCase()}. Provoni një filtër tjetër ose shtoni kapacitete të reja.`
                }
              </p>
              {timeFilter !== 'all' && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleTimeFilterChange('all')}
                  className="mt-2"
                >
                  Shiko të gjitha kapacitetet
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <Trash className="me-2 text-danger" />
            Konfirmo Fshirjen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {capacityToDelete && (
            <div className="text-center">
              <div className="alert-icon mb-3">
                <Calendar3 size={48} className="text-warning" />
              </div>
              <p className="mb-0">
                A jeni të sigurt që dëshironi të fshini kapacitetin për datën 
                <strong className="text-primary"> {format(new Date(capacityToDelete.dita), 'dd/MM/yyyy')}</strong>?
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Anulo
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <Trash className="me-2" size={16} />
            Fshi
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Orders Modal */}
      <Modal show={showOrdersModal} onHide={() => setShowOrdersModal(false)} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <Calendar3 className="me-2" />
            Porositë për {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy EEEE', { locale: sq })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {loadingOrders ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Duke ngarkuar...</span>
              </div>
              <p className="mt-3 text-muted">Duke ngarkuar porositë...</p>
            </div>
          ) : ordersForDate.length > 0 ? (
            <div className="orders-list">
              {ordersForDate.map(order => (
                <Card key={order.id} className="mb-3 order-card">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <div className="d-flex align-items-center mb-2">
                          <Badge bg="primary" className="me-2">#{order.id}</Badge>
                          <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong>
                        </div>
                        <div className="order-details">
                          <div className="detail-item">
                            <DoorOpen className="me-2 text-muted" size={14} />
                            <span className="me-3"><strong>Tipi:</strong> {order.tipiPorosise}</span>
                          </div>
                          <div className="detail-item">
                            <Person className="me-2 text-muted" size={14} />
                            <span><strong>Shitësi:</strong> {order.shitesi}</span>
                          </div>
                        </div>
                      </Col>
                      <Col md={4} className="text-end">
                        <Badge 
                          bg={getDayStatus(order) === 'completed' ? 'success' : 
                              getDayStatus(order) === 'overdue' ? 'danger' : 'warning'} 
                          className="mb-2"
                        >
                          {getDayStatus(order) === 'completed' ? 'E përfunduar' : 
                           getDayStatus(order) === 'overdue' ? 'E vonuar' : 'E planifikuar'}
                        </Badge>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOrderClick(order)}
                          >
                            Detaje
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Calendar3 size={48} className="text-muted mb-3" />
              <h5>Nuk ka porosi për këtë ditë</h5>
              <p className="text-muted">Nuk ka porosi të regjistruara për {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy')}.</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Order Details Modal */}
      <Modal show={showOrderDetailsModal} onHide={() => setShowOrderDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <DoorOpen className="me-2" />
            Detajet e Porosisë #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {selectedOrder && (
            <div>
              {/* Customer Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <Person className="me-2" />
                    Informacionet e Klientit
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <strong>Emri:</strong> {selectedOrder.emriKlientit} {selectedOrder.mbiemriKlientit}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Telefoni:</strong> {selectedOrder.numriTelefonit}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <GeoAlt size={14} className="me-2 text-muted" />
                        <strong>Vendndodhja:</strong> {selectedOrder.vendi}
                      </div>
                      <div className="detail-item mb-2">
                        <DoorOpen size={14} className="me-2 text-muted" />
                        <strong>Tipi i Porosisë:</strong> 
                        <Badge bg="info" className="ms-2">{selectedOrder.tipiPorosise}</Badge>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Order Details */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <DoorOpen className="me-2" />
                    Detajet e Porosisë
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <Calendar3 size={14} className="me-2 text-muted" />
                        <strong>Data e Dorëzimit:</strong> {format(parseISO(selectedOrder.dita), 'dd/MM/yyyy EEEE', { locale: sq })}
                      </div>
                      <div className="detail-item mb-2">
                        <Person size={14} className="me-2 text-muted" />
                        <strong>Shitësi:</strong> {selectedOrder.shitesi}
                      </div>
                      {selectedOrder.matesi && (
                        <div className="detail-item mb-2">
                          <Person size={14} className="me-2 text-muted" />
                          <strong>Matësi:</strong> {selectedOrder.matesi}
                        </div>
                      )}
                    </Col>
                    <Col md={6}>
                      {selectedOrder.installer && (
                        <div className="detail-item mb-2">
                          <Person size={14} className="me-2 text-muted" />
                          <strong>Instaluesi:</strong> {selectedOrder.installer}
                        </div>
                      )}
                      <div className="detail-item mb-2">
                        <strong>Statusi:</strong>
                        <Badge 
                          bg={selectedOrder.statusi === 'e përfunduar' ? 'success' : 
                              selectedOrder.statusi === 'në proces' ? 'warning' : 'danger'} 
                          className="ms-2"
                        >
                          {selectedOrder.statusi}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                  
                  {selectedOrder.pershkrimi && (
                    <div className="mt-3">
                      <strong>Përshkrimi:</strong>
                      <p className="mt-2 text-muted">{selectedOrder.pershkrimi}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              {/* Payment Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <BarChart className="me-2" />
                    Informacionet e Pagesës
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <strong>Çmimi Total:</strong> €{parseFloat(selectedOrder.cmimiTotal).toFixed(2)}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Kaparja:</strong> €{parseFloat(selectedOrder.kaparja || 0).toFixed(2)}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Mbetet për Paguar:</strong> 
                        <span className="text-danger ms-2">
                          €{(parseFloat(selectedOrder.cmimiTotal) - parseFloat(selectedOrder.kaparja || 0)).toFixed(2)}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <strong>Mënyra e Pagesës:</strong> {selectedOrder.menyraPageses}
                      </div>
                      <div className="detail-item mb-2">
                        <strong>Statusi i Pagesës:</strong>
                        <Badge bg={selectedOrder.isPaymentDone ? 'success' : 'danger'} className="ms-2">
                          {selectedOrder.isPaymentDone ? 'E Paguar' : 'E Papaguar'}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={6}>
                      {selectedOrder.kaparaReceiver && (
                        <div className="detail-item mb-2">
                          <Person size={14} className="me-2 text-muted" />
                          <strong>Mori Kaparën:</strong> {selectedOrder.kaparaReceiver}
                        </div>
                      )}
                      {selectedOrder.sender && (
                        <div className="detail-item mb-2">
                          <Person size={14} className="me-2 text-muted" />
                          <strong>Dërguesi:</strong> {selectedOrder.sender}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Dimensions (if available) */}
              {(selectedOrder.gjatesia || selectedOrder.gjeresia) && (
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <BarChart className="me-2" />
                      Dimensionet
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {selectedOrder.gjatesia && (
                        <Col md={3}>
                          <div className="detail-item">
                            <strong>Gjatësia:</strong>
                            <div className="text-info">{selectedOrder.gjatesia} cm</div>
                          </div>
                        </Col>
                      )}
                      {selectedOrder.gjeresia && (
                        <Col md={3}>
                          <div className="detail-item">
                            <strong>Gjerësia:</strong>
                            <div className="text-info">{selectedOrder.gjeresia} cm</div>
                          </div>
                        </Col>
                      )}
                      {selectedOrder.profiliLarte && (
                        <Col md={3}>
                          <div className="detail-item">
                            <strong>Profili i Lartë:</strong>
                            <div className="text-info">{selectedOrder.profiliLarte} cm</div>
                          </div>
                        </Col>
                      )}
                      {selectedOrder.profiliPoshtem && (
                        <Col md={3}>
                          <div className="detail-item">
                            <strong>Profili i Poshtëm:</strong>
                            <div className="text-info">{selectedOrder.profiliPoshtem} cm</div>
                          </div>
                        </Col>
                      )}
                    </Row>
                    
                    {/* Final dimensions */}
                    {selectedOrder.gjatesia && selectedOrder.gjeresia && selectedOrder.profiliLarte && selectedOrder.profiliPoshtem && (
                      <Row className="mt-3 pt-3 border-top">
                        <Col>
                          <div className="text-center">
                            <strong className="text-success">Dimensionet Finale:</strong>
                            <div className="h5 text-success mt-2">
                              {(parseFloat(selectedOrder.gjatesia) - parseFloat(selectedOrder.profiliLarte)).toFixed(1)} cm × {(parseFloat(selectedOrder.gjeresia) - parseFloat(selectedOrder.profiliPoshtem)).toFixed(1)} cm
                            </div>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CapacityManagement; 