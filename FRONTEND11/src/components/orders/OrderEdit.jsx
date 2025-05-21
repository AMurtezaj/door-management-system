import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getOrderById, updateOrder } from '../../services/orderService';
import { getAllCapacities } from '../../services/capacityService';

const OrderEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
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
    kaparaReceiver: '',
    sender: '',
    installer: '',
    menyraPageses: 'kesh',
    dita: format(new Date(), 'yyyy-MM-dd'),
    tipiPorosise: 'derë garazhi',
    pershkrimi: '',
    isPaymentDone: false,
    kaVule: false,
    eshtePrintuar: false,
    statusiMatjes: 'e pamatur'
  });
  
  // Calculated field
  const pagesaMbetur = formData.cmimiTotal && formData.kaparja 
    ? parseFloat(formData.cmimiTotal) - parseFloat(formData.kaparja) 
    : 0;
  
  // Fetch order and capacities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch order details
        const orderData = await getOrderById(id);
        
        // Fetch capacities
        const capacityData = await getAllCapacities();
        
        setCapacities(capacityData);
        
        // Format date fields if needed
        if (orderData.dataMatjes) {
          orderData.dataMatjes = format(new Date(orderData.dataMatjes), 'yyyy-MM-dd');
        }
        if (orderData.dita) {
          orderData.dita = format(new Date(orderData.dita), 'yyyy-MM-dd');
        }
        
        setFormData(orderData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Ka ndodhur një gabim gjatë marrjes së të dhënave');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!formData.emriKlientit || !formData.mbiemriKlientit || !formData.numriTelefonit || 
        !formData.vendi || !formData.shitesi || !formData.cmimiTotal || !formData.dita) {
      setError('Ju lutem plotësoni të gjitha fushat e detyrueshme!');
      return;
    }
    
    setLoading(true);
    
    try {
      await updateOrder(id, formData);
      
      setSuccess('Porosia u përditësua me sukses!');
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ka ndodhur një gabim gjatë përditësimit të porosisë');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Container className="mt-4"><div>Duke ngarkuar...</div></Container>;
  
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Edito Porosinë #{id}</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
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
                    value={formData.matesi || ''}
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
                    value={formData.dataMatjes || ''}
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
                  <Form.Label>Mori Kaparën</Form.Label>
                  <Form.Control
                    type="text"
                    name="kaparaReceiver"
                    value={formData.kaparaReceiver || ''}
                    onChange={handleChange}
                    placeholder="Emri i personit që mori kaparën"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dërguesi</Form.Label>
                  <Form.Control
                    type="text"
                    name="sender"
                    value={formData.sender || ''}
                    onChange={handleChange}
                    placeholder="Personi që dërgoi porosinë"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Montuesi</Form.Label>
                  <Form.Control
                    type="text"
                    name="installer"
                    value={formData.installer || ''}
                    onChange={handleChange}
                    placeholder="Personi që do të montojë derën"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
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
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Dita nuk mund të ndryshohet pasi kapaciteti është i rezervuar.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipi i Porosisë <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="tipiPorosise"
                    value={formData.tipiPorosise}
                    onChange={handleChange}
                    required
                    disabled
                  >
                    <option value="derë garazhi">Derë Garazhi</option>
                    <option value="kapak">Kapak</option>
                    <option value="derë dhome">Derë Dhome</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Tipi i porosisë nuk mund të ndryshohet pasi kapaciteti është i rezervuar.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statusi</Form.Label>
                  <Form.Select
                    name="statusi"
                    value={formData.statusi}
                    onChange={handleChange}
                  >
                    <option value="në proces">Në Proces</option>
                    <option value="e përfunduar">E Përfunduar</option>
                    <option value="borxh">Borxh</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statusi i Matjes</Form.Label>
                  <Form.Select
                    name="statusiMatjes"
                    value={formData.statusiMatjes}
                    onChange={handleChange}
                  >
                    <option value="e pamatur">E Pamatur</option>
                    <option value="e matur">E Matur</option>
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
                    value={formData.pershkrimi || ''}
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
                {loading ? 'Duke Ruajtur...' : 'Ruaj Ndryshimet'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderEdit; 