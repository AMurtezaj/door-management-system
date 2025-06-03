import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Dropdown, Badge, ListGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { format, parseISO, isAfter } from 'date-fns';
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
  const [sortedCapacities, setSortedCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [capacityToDelete, setCapacityToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) or 'asc' (oldest first)
  
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
  
  // Apply sorting when capacities or sort order changes
  useEffect(() => {
    sortCapacities();
  }, [capacities, sortOrder]);
  
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
  
  const sortCapacities = () => {
    const sorted = [...capacities].sort((a, b) => {
      const dateA = new Date(a.dita);
      const dateB = new Date(b.dita);
      
      return sortOrder === 'asc' 
        ? dateA - dateB  // Oldest first
        : dateB - dateA; // Newest first
    });
    
    setSortedCapacities(sorted);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
  
  const handleShowOrders = async (date) => {
    setSelectedDate(date);
    setShowOrdersModal(true);
    setLoadingOrders(true);
    
    try {
      const orders = await getOrdersByDay(date);
      setOrdersForDate(orders);
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
            onClick={() => handleOrderSquareClick(order)}
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
  const handleOrderSquareClick = (order) => {
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
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={toggleSortOrder}
              className="modern-btn-outline"
            >
              <ArrowRepeat className="me-2" size={16} />
              {sortOrder === 'desc' ? 'Më të vjetrat para' : 'Më të rejat para'}
            </Button>
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
          ) : sortedCapacities.length > 0 ? (
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
                  {sortedCapacities.map(capacity => (
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
                            <BarChart className="me-2 text-info" size={16} />
                            <strong>{capacity.kapake}</strong>
                          </div>
                          <div className="capacity-visual mt-2">
                            {renderCapacitySquares(capacity, 'kapake')}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {canManageCapacities && (
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleEdit(capacity)}
                              className="action-btn"
                            >
                              <Pencil size={14} />
                            </Button>
                          )}
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            onClick={() => handleShowOrders(capacity.dita)}
                            className="action-btn"
                          >
                            <Eye size={14} />
                          </Button>
                          {canManageCapacities && (
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteClick(capacity)}
                              className="action-btn"
                            >
                              <Trash size={14} />
                            </Button>
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
              <h5>Nuk ka kapacitete të konfiguruar</h5>
              <p className="text-muted">Ju lutem shtoni një kapacitet të ri për të filluar.</p>
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
            <Eye className="me-2 text-primary" />
            Porositë për {selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy', { locale: sq }) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {loadingOrders ? (
            <div className="loading-state">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Duke ngarkuar...</span>
              </div>
              <p className="mt-3">Duke ngarkuar porositë...</p>
            </div>
          ) : ordersForDate.length > 0 ? (
            <div className="orders-list">
              {ordersForDate.map((order, index) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="customer-info">
                      <h6 className="customer-name">
                        <Person className="me-2" size={16} />
                        {order.Customer?.emriKlientit} {order.Customer?.mbiemriKlientit}
                      </h6>
                      <div className="order-badge">
                        {getStatusBadge(order)}
                      </div>
                    </div>
                    <div className="order-id">
                      #{order.id}
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="detail-item">
                      <Phone size={14} className="me-2 text-muted" />
                      <span>{order.Customer?.numriTelefonit}</span>
                    </div>
                    <div className="detail-item">
                      <GeoAlt size={14} className="me-2 text-muted" />
                      <span>{order.Customer?.vendi}</span>
                    </div>
                    <div className="detail-item">
                      <DoorOpen size={14} className="me-2 text-muted" />
                      <span>{order.OrderDetail?.tipiPorosise}</span>
                    </div>
                    <div className="detail-item">
                      <CurrencyEuro size={14} className="me-2 text-muted" />
                      <span>{order.Payment?.cmimiTotal}€ (Kaparja: {order.Payment?.kaparja}€)</span>
                    </div>
                    <div className="detail-item">
                      <Person size={14} className="me-2 text-muted" />
                      <span>Shitësi: {order.OrderDetail?.shitesi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarCheck size={48} className="text-muted mb-3" />
              <h5>Nuk ka porosi</h5>
              <p className="text-muted">Nuk ka porosi të regjistruara për këtë ditë.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button variant="outline-secondary" onClick={() => setShowOrdersModal(false)}>
            Mbyll
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Individual Order Details Modal */}
      <Modal show={showOrderDetailsModal} onHide={() => setShowOrderDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <InfoCircle className="me-2 text-primary" />
            Detajet e Porosisë #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          {selectedOrder && (
            <div>
              {/* Status Badge */}
              <div className="text-center mb-4">
                <div className="order-status-display">
                  {selectedOrder.statusi === 'e përfunduar' ? (
                    <div className="status-icon completed">
                      <CheckCircleFill size={32} className="text-success" />
                      <h5 className="mt-2 text-success">E Përfunduar</h5>
                    </div>
                  ) : isAfter(new Date(), parseISO(selectedOrder.dita)) ? (
                    <div className="status-icon overdue">
                      <ExclamationTriangleFill size={32} className="text-warning" />
                      <h5 className="mt-2 text-warning">E Vonuar</h5>
                    </div>
                  ) : (
                    <div className="status-icon scheduled">
                      <Clock size={32} className="text-danger" />
                      <h5 className="mt-2 text-danger">E Planifikuar</h5>
                    </div>
                  )}
                </div>
              </div>
              
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
                        <Phone size={14} className="me-2 text-muted" />
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
                        <strong>Tipi:</strong> {selectedOrder.tipiPorosise}
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
                      {selectedOrder.dataMatjes && (
                        <div className="detail-item mb-2">
                          <Calendar3 size={14} className="me-2 text-muted" />
                          <strong>Data e Matjes:</strong> {format(parseISO(selectedOrder.dataMatjes), 'dd/MM/yyyy', { locale: sq })}
                        </div>
                      )}
                      <div className="detail-item mb-2">
                        <strong>Statusi i Matjes:</strong> 
                        <Badge bg={selectedOrder.statusiMatjes === 'e matur' ? 'success' : 'warning'} className="ms-2">
                          {selectedOrder.statusiMatjes}
                        </Badge>
                      </div>
                    </Col>
                  </Row>
                  
                  {selectedOrder.pershkrimi && (
                    <div className="mt-3">
                      <strong>Përshkrimi:</strong>
                      <p className="mt-1 text-muted">{selectedOrder.pershkrimi}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
              
              {/* Financial Information */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <CurrencyEuro className="me-2" />
                    Informacionet Financiare
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="detail-item mb-2">
                        <strong>Çmimi Total:</strong>
                        <div className="text-primary h5 mb-0">{selectedOrder.cmimiTotal}€</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-item mb-2">
                        <strong>Kaparja:</strong>
                        <div className="text-success h5 mb-0">{selectedOrder.kaparja}€</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="detail-item mb-2">
                        <strong>Pagesa e Mbetur:</strong>
                        <div className="text-warning h5 mb-0">{(selectedOrder.cmimiTotal - selectedOrder.kaparja).toFixed(2)}€</div>
                      </div>
                    </Col>
                  </Row>
                  <Row>
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
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button variant="outline-secondary" onClick={() => setShowOrderDetailsModal(false)}>
            Mbyll
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowOrderDetailsModal(false);
              // Navigate to edit order - you might want to add this functionality
              console.log('Navigate to edit order:', selectedOrder?.id);
            }}
          >
            <Pencil className="me-2" size={16} />
            Edito Porosinë
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CapacityManagement; 