import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Modal } from 'react-bootstrap';
import { updateDimensions, getDimensionCalculations } from '../../services/orderService';
import DimensionVisualization from './DimensionVisualization';

const DimensionManager = ({ orderId, initialDimensions, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculations, setCalculations] = useState(null);
  
  const [formData, setFormData] = useState({
    gjatesia: '',
    gjeresia: '',
    profiliLarte: '0',
    profiliPoshtem: '0'
  });

  // Initialize form data with existing dimensions
  useEffect(() => {
    if (initialDimensions) {
      setFormData({
        gjatesia: initialDimensions.gjatesia || '',
        gjeresia: initialDimensions.gjeresia || '',
        profiliLarte: initialDimensions.profiliLarte || '0',
        profiliPoshtem: initialDimensions.profiliPoshtem || '0'
      });
    }
  }, [initialDimensions]);

  // Load existing calculations when modal opens
  useEffect(() => {
    if (showModal && orderId) {
      loadCalculations();
    }
  }, [showModal, orderId]);

  const loadCalculations = async () => {
    try {
      const data = await getDimensionCalculations(orderId);
      setCalculations(data);
    } catch (err) {
      console.error('Error loading calculations:', err);
      // Don't show error for missing calculations
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
    setLoading(true);

    try {
      // Validate that at least one dimension is provided
      if (!formData.gjatesia && !formData.gjeresia) {
        setError('Ju lutem shkruani të paktën një dimension (gjatësi ose gjerësi)');
        setLoading(false);
        return;
      }

      // Validate numeric values
      const validateNumber = (value, fieldName) => {
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
          throw new Error(`${fieldName} duhet të jetë një numër pozitiv!`);
        }
      };

      validateNumber(formData.gjatesia, 'Gjatësia');
      validateNumber(formData.gjeresia, 'Gjerësia');
      validateNumber(formData.profiliLarte, 'Profili i lartë');
      validateNumber(formData.profiliPoshtem, 'Profili i poshtëm');

      const result = await updateDimensions(orderId, formData);
      
      setCalculations(result.dimensionCalculations);
      setSuccess('Dimensionet u përditësuan me sukses!');
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(result.order);
      }

    } catch (err) {
      console.error('Error updating dimensions:', err);
      setError(err.message || 'Ka ndodhur një gabim gjatë përditësimit të dimensioneve');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  // Calculate preview values
  const previewCalculations = {
    gjatesiaFinale: formData.gjatesia ? 
      parseFloat(formData.gjatesia || 0) - parseFloat(formData.profiliLarte || 0) : null,
    gjeresiaFinale: formData.gjeresia ? 
      parseFloat(formData.gjeresia || 0) - parseFloat(formData.profiliPoshtem || 0) : null
  };

  return (
    <>
      <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={() => setShowModal(true)}
        className="me-2"
      >
        📏 Menaxho Dimensionet
      </Button>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📏 Menaxhimi i Dimensioneve - Porosia #{orderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gjatësia (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="gjatesia"
                    value={formData.gjatesia}
                    onChange={handleChange}
                    placeholder="Shkruani gjatësinë e derës"
                  />
                  <Form.Text className="text-muted">
                    Gjatësia e matur e derës
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gjerësia (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="gjeresia"
                    value={formData.gjeresia}
                    onChange={handleChange}
                    placeholder="Shkruani gjerësinë e derës"
                  />
                  <Form.Text className="text-muted">
                    Gjerësia e matur e derës
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Profili i Lartë (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="profiliLarte"
                    value={formData.profiliLarte}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Vlera që zbritet nga gjatësia
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Profili i Poshtëm (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="profiliPoshtem"
                    value={formData.profiliPoshtem}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Vlera që zbritet nga gjerësia
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Preview calculations */}
            {(formData.gjatesia || formData.gjeresia) && (
              <Card className="mb-3 bg-light">
                <Card.Header>
                  <h6 className="mb-0">🔍 Parashikimi i Llogaritjeve</h6>
                </Card.Header>
                <Card.Body>
                  {formData.gjatesia && (
                    <div className="mb-2">
                      <strong>Gjatësia Finale:</strong> {formData.gjatesia} - {formData.profiliLarte || 0} = 
                      <span className="text-primary ms-1">{previewCalculations.gjatesiaFinale?.toFixed(2)} cm</span>
                    </div>
                  )}
                  {formData.gjeresia && (
                    <div>
                      <strong>Gjerësia Finale:</strong> {formData.gjeresia} - {formData.profiliPoshtem || 0} = 
                      <span className="text-primary ms-1">{previewCalculations.gjeresiaFinale?.toFixed(2)} cm</span>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={handleClose}>
                Anulo
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Duke Ruajtur...' : 'Ruaj Dimensionet'}
              </Button>
            </div>
          </Form>

          {/* Show visualization if calculations exist */}
          {calculations && (
            <div className="mt-4">
              <hr />
              <DimensionVisualization 
                dimensions={{
                  gjatesia: formData.gjatesia,
                  gjeresia: formData.gjeresia,
                  profiliLarte: formData.profiliLarte,
                  profiliPoshtem: formData.profiliPoshtem,
                  gjatesiaFinale: calculations.gjatesiaFinale,
                  gjeresiaFinale: calculations.gjeresiaFinale
                }} 
              />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default DimensionManager; 