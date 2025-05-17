import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import { getAllCapacities } from '../../services/capacityService';

const OrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDateFromDashboard = location.state?.selectedDate;
  
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    emriKlientit: '',
    mbiemriKlientit: '',
    numriTelefonit: '',
    vendi: '',
    shitesi: '',
    matesi: '',
    dataMatjes: '',
    cmimiTotal: '',
    kaparja: '0',
    menyraPageses: 'kesh',
    dita: selectedDateFromDashboard || format(new Date(), 'yyyy-MM-dd'),
    tipiPorosise: 'derë garazhi',
    pershkrimi: '',
    isPaymentDone: false,
    kaVule: false,
    eshtePrintuar: false
  });
  
  // Calculated field
  const pagesaMbetur = formData.cmimiTotal && formData.kaparja 
    ? parseFloat(formData.cmimiTotal) - parseFloat(formData.kaparja) 
    : 0;
  
  // Fetch daily capacities
  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        const data = await getAllCapacities();
        setCapacities(data);
      } catch (err) {
        console.error('Error fetching capacities:', err);
        setError('Ka ndodhur një gabim gjatë marrjes së kapaciteteve');
      }
    };
    
    fetchCapacities();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const checkCapacity = () => {
    const selectedDay = formData.dita;
    const dayCapacity = capacities.find(c => c.dita === selectedDay);
    
    if (!dayCapacity) return { valid: false, message: 'Nuk ka kapacitet të konfiguruar për këtë ditë. Ju lutem zgjidhni një ditë tjetër.' };
    
    if (formData.tipiPorosise === 'derë garazhi') {
      if (dayCapacity.dyerGarazhi <= 0) {
        return { valid: false, message: 'Nuk ka kapacitet të disponueshëm për dyer garazhi për këtë ditë.' };
      }
    }
    
    if (formData.tipiPorosise === 'kapak') {
      if (dayCapacity.kapake <= 0) {
        return { valid: false, message: 'Nuk ka kapacitet të disponueshëm për kapakë për këtë ditë.' };
      }
    }
    
    return { valid: true };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate capacity
    const capacityCheck = checkCapacity();
    if (!capacityCheck.valid) {
      setError(capacityCheck.message);
      return;
    }
    
    // Validate required fields
    if (!formData.emriKlientit || !formData.mbiemriKlientit || !formData.numriTelefonit || 
        !formData.vendi || !formData.shitesi || !formData.cmimiTotal || !formData.dita) {
      setError('Ju lutem plotësoni të gjitha fushat e detyrueshme!');
      return;
    }
    
    setLoading(true);
    
    try {
      await createOrder(formData);
      
      setSuccess('Porosia u krijua me sukses!');
      // Reset form or redirect
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ka ndodhur një gabim gjatë krijimit të porosisë');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Function to render capacity visualization for the selected day
  const renderDayCapacity = () => {
    const selectedDay = formData.dita;
    const capacity = capacities.find(c => c.dita === selectedDay);
    
    if (!capacity) {
      return (
        <Alert variant="warning">
          Nuk ka kapacitet të caktuar për këtë ditë. Ju lutem caktoni kapacitetin e ditës.
        </Alert>
      );
    }
    
    const renderSquares = (type) => {
      const available = Math.max(0, capacity[type] || 0);
      const squares = [];
      
      // Create squares to represent available capacity
      for (let i = 0; i < available; i++) {
        squares.push(
          <div 
            key={`${type}-${i}`}
            className="capacity-square available"
          />
        );
      }
      
      return (
        <div className="capacity-squares d-flex gap-1 flex-wrap">
          {squares}
        </div>
      );
    };
    
    // Get day of week in Albanian
    const dayOfWeek = format(new Date(selectedDay), 'EEEE', { locale: sq });
    
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5>Kapaciteti për {format(new Date(selectedDay), 'dd/MM/yyyy')} ({dayOfWeek})</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Dyer Garazhi: {capacity.dyerGarazhi || 0} të disponueshme</h6>
              {renderSquares('dyerGarazhi')}
            </Col>
            <Col md={6}>
              <h6>Kapakë: {capacity.kapake || 0} të disponueshëm</h6>
              {renderSquares('kapake')}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Krijo Porosi të Re</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          {formData.dita && renderDayCapacity()}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Emri i Klientit <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="emriKlientit"
                    value={formData.emriKlientit}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Mbiemri i Klientit <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="mbiemriKlientit"
                    value={formData.mbiemriKlientit}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Numri i Telefonit <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="numriTelefonit"
                    value={formData.numriTelefonit}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vendi <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="vendi"
                    value={formData.vendi}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Shitësi <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="shitesi"
                    value={formData.shitesi}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Matësi</Form.Label>
                  <Form.Control
                    type="text"
                    name="matesi"
                    value={formData.matesi}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data e Matjes</Form.Label>
                  <Form.Control
                    type="date"
                    name="dataMatjes"
                    value={formData.dataMatjes}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Çmimi Total <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="cmimiTotal"
                    value={formData.cmimiTotal}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kaparja</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="kaparja"
                    value={formData.kaparja}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pagesa e Mbetur</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={pagesaMbetur}
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Mënyra e Pagesës <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="menyraPageses"
                    value={formData.menyraPageses}
                    onChange={handleChange}
                    required
                  >
                    <option value="kesh">Kesh</option>
                    <option value="banke">Bankë</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
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
                  <Form.Label>Tipi i Porosisë <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tipiPorosise"
                    value={formData.tipiPorosise}
                    onChange={handleChange}
                    required
                  >
                    <option value="derë garazhi">Derë Garazhi</option>
                    <option value="kapak">Kapak</option>
                    <option value="derë dhome">Derë Dhome</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Përshkrimi</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="pershkrimi"
                    value={formData.pershkrimi}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Pagesa e Përfunduar"
                    name="isPaymentDone"
                    checked={formData.isPaymentDone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Ka Vulë"
                    name="kaVule"
                    checked={formData.kaVule}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Është Printuar"
                    name="eshtePrintuar"
                    checked={formData.eshtePrintuar}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => navigate('/orders')}>
                Anulo
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Duke Ruajtur...' : 'Ruaj Porosinë'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderForm; 