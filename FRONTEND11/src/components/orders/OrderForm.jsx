import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { 
  Person, 
  Telephone, 
  GeoAlt, 
  People, 
  List, 
  Calendar, 
  CurrencyEuro, 
  CreditCard, 
  Tools, 
  Truck, 
  House,
  FileText,
  CheckCircle,
  Save,
  X,
  InfoCircle
} from 'react-bootstrap-icons';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import { getAllCapacities } from '../../services/capacityService';
import './OrderForm.css';

const OrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDateFromDashboard = location.state?.selectedDate;
  
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
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
    dita: selectedDateFromDashboard || format(new Date(), 'yyyy-MM-dd'),
    tipiPorosise: 'derë garazhi',
    pershkrimi: '',
    isPaymentDone: false,
    kaVule: false,
    eshtePrintuar: false,
    gjatesia: '',
    gjeresia: '',
    profiliLarte: '0',
    profiliPoshtem: '0'
  });
  
  // Calculated field
  const pagesaMbetur = formData.cmimiTotal && formData.kaparja 
    ? parseFloat(formData.cmimiTotal) - parseFloat(formData.kaparja) 
    : 0;

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['emriKlientit', 'mbiemriKlientit', 'numriTelefonit', 'vendi', 'shitesi', 'cmimiTotal', 'dita'];
    const filledFields = requiredFields.filter(field => formData[field] && formData[field].toString().trim() !== '');
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };
  
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
        return { valid: false, message: 'Nuk ka kapacitet të disponueshëm për kapgjik për këtë ditë.' };
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
        <Alert variant="warning" className="capacity-alert">
          <InfoCircle className="me-2" />
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
      <Card className="capacity-card mb-4">
        <Card.Header className="capacity-header">
          <div className="d-flex align-items-center">
            <Calendar className="me-2 text-primary" size={20} />
            <h5 className="mb-0">Kapaciteti për {format(new Date(selectedDay), 'dd/MM/yyyy')} ({dayOfWeek})</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="capacity-item">
                <div className="d-flex align-items-center mb-2">
                  <House className="me-2 text-success" size={18} />
                  <h6 className="mb-0">Dyer Garazhi: {capacity.dyerGarazhi || 0} të disponueshme</h6>
                </div>
                {renderSquares('dyerGarazhi')}
              </div>
            </Col>
            <Col md={6}>
              <div className="capacity-item">
                <div className="d-flex align-items-center mb-2">
                  <Tools className="me-2 text-info" size={18} />
                  <h6 className="mb-0">Kapgjik: {capacity.kapake || 0} të disponueshëm</h6>
                </div>
                {renderSquares('kapake')}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const progress = calculateProgress();
  
  return (
    <Container className="order-form-container py-4">
      <div className="form-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="form-title mb-2">
              <FileText className="me-3 text-primary" size={32} />
              Krijo Porosi të Re
            </h2>
            <p className="form-subtitle text-muted">
              Plotësoni të gjitha informacionet e nevojshme për porosinë e re
            </p>
          </div>
          <div className="progress-section">
            <div className="d-flex align-items-center mb-2">
              <span className="me-2 text-muted">Përparimi:</span>
              <Badge bg={progress === 100 ? 'success' : progress > 50 ? 'warning' : 'secondary'}>
                {progress}%
              </Badge>
            </div>
            <ProgressBar 
              now={progress} 
              variant={progress === 100 ? 'success' : progress > 50 ? 'warning' : 'info'}
              style={{ width: '200px', height: '8px' }}
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="modern-alert">
          <X className="me-2" />
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="modern-alert">
          <CheckCircle className="me-2" />
          {success}
        </Alert>
      )}
      
      {formData.dita && renderDayCapacity()}
      
      <Form onSubmit={handleSubmit} className="modern-form">
        {/* Customer Information Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <Person className="me-2 text-primary" size={20} />
              <h5 className="mb-0">Informacionet e Klientit</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Person className="me-2" size={16} />
                    Emri i Klientit <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="emriKlientit"
                    value={formData.emriKlientit}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shkruani emrin"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Person className="me-2" size={16} />
                    Mbiemri i Klientit <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="mbiemriKlientit"
                    value={formData.mbiemriKlientit}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shkruani mbiemrin"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Telephone className="me-2" size={16} />
                    Numri i Telefonit <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="numriTelefonit"
                    value={formData.numriTelefonit}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="+355 XX XXX XXX"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <GeoAlt className="me-2" size={16} />
                    Vendi <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="vendi"
                    value={formData.vendi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shkruani vendndodhjen"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <People className="me-2" size={16} />
                    Shitësi <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="shitesi"
                    value={formData.shitesi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Emri i shitësit"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Measurement Information Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <List className="me-2 text-success" size={20} />
              <h5 className="mb-0">Informacionet e Matjes</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <People className="me-2" size={16} />
                    Matësi
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="matesi"
                    value={formData.matesi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Emri i matësit"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Calendar className="me-2" size={16} />
                    Data e Matjes
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dataMatjes"
                    value={formData.dataMatjes}
                    onChange={handleChange}
                    className="form-input"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Financial Information Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <CurrencyEuro className="me-2 text-warning" size={20} />
              <h5 className="mb-0">Informacionet Financiare</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Çmimi Total <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="cmimiTotal"
                    value={formData.cmimiTotal}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Kaparja
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="kaparja"
                    value={formData.kaparja}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Pagesa e Mbetur
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={pagesaMbetur.toFixed(2)}
                    readOnly
                    className="form-input calculated-field"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <People className="me-2" size={16} />
                    Mori Kaparën
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="kaparaReceiver"
                    value={formData.kaparaReceiver}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Emri i personit që mori kaparën"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CreditCard className="me-2" size={16} />
                    Mënyra e Pagesës <span className="required">*</span>
                  </Form.Label>
                  <Form.Select
                    name="menyraPageses"
                    value={formData.menyraPageses}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="kesh">💵 Kesh</option>
                    <option value="banke">🏦 Bankë</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Personnel Information Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <Truck className="me-2 text-info" size={20} />
              <h5 className="mb-0">Informacionet e Personelit</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Truck className="me-2" size={16} />
                    Dërguesi
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="sender"
                    value={formData.sender}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Personi që dërgoi porosinë"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Tools className="me-2" size={16} />
                    Montuesi
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="installer"
                    value={formData.installer}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Personi që do të montojë derën"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Order Details Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <House className="me-2 text-primary" size={20} />
              <h5 className="mb-0">Detajet e Porosisë</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Calendar className="me-2" size={16} />
                    Dita <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dita"
                    value={formData.dita}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <House className="me-2" size={16} />
                    Tipi i Porosisë <span className="required">*</span>
                  </Form.Label>
                  <Form.Select
                    name="tipiPorosise"
                    value={formData.tipiPorosise}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="derë garazhi">🏠 Derë Garazhi</option>
                    <option value="kapak">🔧 Kapgjik</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <FileText className="me-2" size={16} />
                    Përshkrimi
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="pershkrimi"
                    value={formData.pershkrimi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shënime shtesë për porosinë..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Dimensions Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <List className="me-2 text-success" size={20} />
              <h5 className="mb-0">Dimensionet e Derës</h5>
            </div>
            <small className="text-muted">Këto fusha janë opsionale dhe përdoren për printimin e faturës</small>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Gjatësia (cm)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="gjatesia"
                    value={formData.gjatesia}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shkruani gjatësinë e derës"
                  />
                  <Form.Text className="text-muted">
                    Gjatësia e matur e derës
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Gjerësia (cm)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="gjeresia"
                    value={formData.gjeresia}
                    onChange={handleChange}
                    className="form-input"
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
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Profili i Lartë (cm)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="profiliLarte"
                    value={formData.profiliLarte}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Vlera që zbritet nga gjatësia
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Profili i Poshtëm (cm)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="profiliPoshtem"
                    value={formData.profiliPoshtem}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Vlera që zbritet nga gjerësia
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Calculation Display */}
            {(formData.gjatesia || formData.gjeresia) && (
              <Row>
                <Col md={12}>
                  <div className="calculation-display">
                    <h6 className="calculation-title">
                      <InfoCircle className="me-2" size={16} />
                      Llogaritjet:
                    </h6>
                    {formData.gjatesia && (
                      <div className="calculation-item">
                        <strong>Gjatësia Finale:</strong> {formData.gjatesia} - {formData.profiliLarte || 0} = 
                        <span className="result">{(parseFloat(formData.gjatesia || 0) - parseFloat(formData.profiliLarte || 0)).toFixed(2)} cm</span>
                      </div>
                    )}
                    {formData.gjeresia && (
                      <div className="calculation-item">
                        <strong>Gjerësia Finale:</strong> {formData.gjeresia} - {formData.profiliPoshtem || 0} = 
                        <span className="result">{(parseFloat(formData.gjeresia || 0) - parseFloat(formData.profiliPoshtem || 0)).toFixed(2)} cm</span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Status Options Section */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <CheckCircle className="me-2 text-success" size={20} />
              <h5 className="mb-0">Opsionet e Statusit</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Check
                    type="checkbox"
                    label="💰 Pagesa e Përfunduar"
                    name="isPaymentDone"
                    checked={formData.isPaymentDone}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Check
                    type="checkbox"
                    label="🔖 Ka Vulë"
                    name="kaVule"
                    checked={formData.kaVule}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Check
                    type="checkbox"
                    label="🖨️ Është Printuar"
                    name="eshtePrintuar"
                    checked={formData.eshtePrintuar}
                    onChange={handleChange}
                    className="custom-checkbox"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button 
            variant="outline-secondary" 
            className="action-btn cancel-btn me-3" 
            onClick={() => navigate('/orders')}
            disabled={loading}
          >
            <X className="me-2" size={16} />
            Anulo
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || progress < 100}
            className="action-btn submit-btn"
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Duke Ruajtur...
              </>
            ) : (
              <>
                <Save className="me-2" size={16} />
                Ruaj Porosinë
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default OrderForm; 