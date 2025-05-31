import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import { sq } from 'date-fns/locale';
import { getAllCapacities, setCapacity, deleteCapacity } from '../../services/capacityService';
import { getOrdersByDay } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
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
  
  const renderCapacitySquares = (capacity, type) => {
    // Use capacity value directly without assuming a fixed total
    const available = Math.max(0, capacity[type] || 0);
    
    // Create array of available squares
    return (
      <div className="d-flex gap-1 flex-wrap">
        {Array.from({ length: available }, (_, i) => (
          <div 
            key={`${type}-available-${i}`}
            className="capacity-square available"
          />
        ))}
      </div>
    );
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
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Menaxhimi i Kapacitetit Ditor</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          {!canManageCapacities && (
            <Alert variant="info">
              <strong>Njoftim:</strong> Si menaxher, ju mund të shikoni kapacitetet dhe porositë, por nuk mund të bëni ndryshime në kapacitete. Vetëm administratori mund të menaxhojë kapacitetet ditore.
            </Alert>
          )}
          
          {canManageCapacities && (
            <>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dita <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="dita"
                        value={formData.dita}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dyer Garazhi <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="dyerGarazhi"
                        value={formData.dyerGarazhi}
                        onChange={handleChange}
                        min="0"
                        placeholder="Vendosni numrin e dyerve të disponueshme"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Kapgjik <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="kapake"
                        value={formData.kapake}
                        onChange={handleChange}
                        min="0"
                        placeholder="Vendosni numrin e kapgjikëve të disponueshëm"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end">
                  <Button variant="primary" type="submit">
                    Ruaj Kapacitetin
                  </Button>
                </div>
              </Form>
              
              <hr />
            </>
          )}
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Kapacitetet e Konfiguruara</h4>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={toggleSortOrder}
            >
              {sortOrder === 'desc' ? 'Më të vjetrat para' : 'Më të rejat para'}
            </Button>
          </div>
          
          {loading ? (
            <div>Duke ngarkuar...</div>
          ) : sortedCapacities.length > 0 ? (
            <Table striped bordered hover responsive>
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
                    <td>{format(new Date(capacity.dita), 'dd/MM/yyyy')}</td>
                    <td>{getAlbanianDayOfWeek(capacity.dita)}</td>
                    <td>
                      {capacity.dyerGarazhi}
                      <div className="mt-1">
                        {renderCapacitySquares(capacity, 'dyerGarazhi')}
                      </div>
                    </td>
                    <td>
                      {capacity.kapake}
                      <div className="mt-1">
                        {renderCapacitySquares(capacity, 'kapake')}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {canManageCapacities && (
                          <>
                            <Button 
                              variant="info" 
                              size="sm" 
                              onClick={() => handleEdit(capacity)}
                            >
                              Edito
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleShowOrders(capacity.dita)}
                        >
                          Shiko porositë për këtë ditë
                        </Button>
                        {canManageCapacities && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteClick(capacity)}
                          >
                            Fshi
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Alert variant="info">
              Nuk ka kapacitete të konfiguruar. Ju lutem shtoni një kapacitet të ri.
            </Alert>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmo Fshirjen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {capacityToDelete && (
            <p>
              A jeni të sigurt që dëshironi të fshini kapacitetin për datën 
              <strong> {format(new Date(capacityToDelete.dita), 'dd/MM/yyyy')}</strong>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Anulo
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Fshi
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Orders Modal */}
      <Modal show={showOrdersModal} onHide={() => setShowOrdersModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Porositë për {selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy', { locale: sq }) : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingOrders ? (
            <div className="text-center p-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Duke ngarkuar...</span>
              </div>
              <p className="mt-2">Duke ngarkuar porositë...</p>
            </div>
          ) : ordersForDate.length > 0 ? (
            <ListGroup>
              {ordersForDate.map((order, index) => (
                <ListGroup.Item key={order.id} className="d-flex justify-content-between align-items-start">
                  <div className="ms-2 me-auto">
                    <div className="fw-bold">
                      {order.Customer?.emriKlientit} {order.Customer?.mbiemriKlientit}
                    </div>
                    <div className="text-muted small">
                      <div>📞 {order.Customer?.numriTelefonit}</div>
                      <div>📍 {order.Customer?.vendi}</div>
                      <div>🚪 {order.OrderDetail?.tipiPorosise}</div>
                      <div>💰 {order.Payment?.cmimiTotal}€ (Kaparja: {order.Payment?.kaparja}€)</div>
                      <div>👤 Shitësi: {order.OrderDetail?.shitesi}</div>
                    </div>
                  </div>
                  <div className="text-end">
                    {getStatusBadge(order)}
                    <div className="text-muted small mt-1">
                      #{order.id}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info">
              Nuk ka porosi të regjistruara për këtë ditë.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrdersModal(false)}>
            Mbyll
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CapacityManagement; 