import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Modal, Dropdown } from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import { sq } from 'date-fns/locale';
import { getAllCapacities, setCapacity, deleteCapacity } from '../../services/capacityService';
import './capacity.css';

const CapacityManagement = () => {
  const [capacities, setCapacities] = useState([]);
  const [sortedCapacities, setSortedCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [capacityToDelete, setCapacityToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (newest first) or 'asc' (oldest first)
  
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
                  <Form.Label>Kapakë <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="kapake"
                    value={formData.kapake}
                    onChange={handleChange}
                    min="0"
                    placeholder="Vendosni numrin e kapakëve të disponueshëm"
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
                  <th>Kapakë</th>
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
                        <Button 
                          variant="info" 
                          size="sm" 
                          onClick={() => handleEdit(capacity)}
                        >
                          Edito
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDeleteClick(capacity)}
                        >
                          Fshi
                        </Button>
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
    </Container>
  );
};

export default CapacityManagement; 