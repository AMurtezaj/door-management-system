import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { 
  Person, 
  Telephone, 
  GeoAlt, 
  People, 
  List, 
  Calendar, 
  House,
  FileText,
  CheckCircle,
  Save,
  X,
  InfoCircle,
  CurrencyEuro,
  CreditCard
} from 'react-bootstrap-icons';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import { getAllCapacities } from '../../services/capacityService';
import './OrderForm.css';

const MeasurementEntryForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDateFromDashboard = location.state?.selectedDate;
  
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Using the same field names as OrderForm for consistency
  const [formData, setFormData] = useState({
    emriKlientit: '',
    mbiemriKlientit: '',
    numriTelefonit: '',
    vendi: '',
    shitesi: '',
    matesi: '',
    dataMatjes: format(new Date(), 'yyyy-MM-dd'),
    sasia: '1', // Default quantity
    cmimiNjesite: '', // Unit price - optional for now
    cmimiTotal: '', // Optional for now, can be added later
    kaparja: '0',
    kaparaReceiver: '', // Person who received the advance payment
    menyraPageses: 'kesh',
    dita: null, // Will be assigned later after measurements are completed
    tipiPorosise: 'derë garazhi',
    pershkrimi: '',
    statusiMatjes: 'e pamatur', // Default to not measured, can be changed
    gjatesia: '',
    gjeresia: '',
    profiliLarte: '0',
    profiliPoshtem: '0',
    // Special flags for this flow
    isIncomplete: true, // Mark as incomplete order
    sender: '', // Will be empty initially
    installer: '', // Will be empty initially
    isPaymentDone: false,
    eshtePrintuar: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Fetch capacities on mount
  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        const data = await getAllCapacities();
        setCapacities(data);
      } catch (error) {
        console.error('Error fetching capacities:', error);
      }
    };
    
    fetchCapacities();
  }, []);

  // Calculate total price when unit price or quantity changes
  useEffect(() => {
    if (formData.cmimiNjesite && formData.sasia) {
      const unitPrice = parseFloat(formData.cmimiNjesite);
      const quantity = parseInt(formData.sasia);
      if (!isNaN(unitPrice) && !isNaN(quantity) && unitPrice > 0 && quantity > 0) {
        const totalPrice = (unitPrice * quantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          cmimiTotal: totalPrice
        }));
      }
    }
  }, [formData.cmimiNjesite, formData.sasia]);

  // Calculate unit price when total price or quantity changes (if unit price is empty)
  useEffect(() => {
    if (formData.cmimiTotal && formData.sasia && !formData.cmimiNjesite) {
      const totalPrice = parseFloat(formData.cmimiTotal);
      const quantity = parseInt(formData.sasia);
      if (!isNaN(totalPrice) && !isNaN(quantity) && totalPrice > 0 && quantity > 0) {
        const unitPrice = (totalPrice / quantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          cmimiNjesite: unitPrice
        }));
      }
    }
  }, [formData.cmimiTotal, formData.sasia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!formData.emriKlientit || !formData.mbiemriKlientit || !formData.numriTelefonit || 
        !formData.vendi || !formData.shitesi || !formData.matesi) {
      setError('Ju lutem plotësoni të gjitha fushat e detyrueshme!');
      return;
    }
    
    setLoading(true);
    
    try {
      // Helper function to convert empty strings to null for numeric fields
      const parseNumericField = (value) => {
        if (value === '' || value === null || value === undefined) {
          return null;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };
      
      // Prepare form data with proper handling of empty fields
      const submitData = {
        ...formData,
        // Financial fields - convert empty strings to 0 or proper numbers
        cmimiTotal: parseNumericField(formData.cmimiTotal) || 0,
        kaparja: parseNumericField(formData.kaparja) || 0,
        
        // Dimension fields - convert empty strings to null (since they're optional)
        gjatesia: parseNumericField(formData.gjatesia),
        gjeresia: parseNumericField(formData.gjeresia),
        profiliLarte: parseNumericField(formData.profiliLarte) || 0,
        profiliPoshtem: parseNumericField(formData.profiliPoshtem) || 0
      };
      
      console.log('Submitting data:', submitData); // Debug log
      
      await createOrder(submitData);
      
      setSuccess('Të dhënat e matjes u ruajtën me sukses! Mund ta kompletoni porosinë më vonë.');
      // Reset form or redirect
      setTimeout(() => {
        navigate('/orders/incomplete');
      }, 2000);
    } catch (err) {
      console.error('Submit error:', err); // Debug log
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ka ndodhur një gabim gjatë ruajtjes së të dhënave');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate form completion percentage for measurements
  const calculateProgress = () => {
    const requiredFields = [
      'emriKlientit', 'mbiemriKlientit', 'numriTelefonit', 'vendi', 'shitesi', 'matesi'
    ];
    const completedFields = requiredFields.filter(field => formData[field] && formData[field].toString().trim() !== '');
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <Container className="order-form-container">
      {/* Header */}
      <Card className="form-header mb-4">
        <Row>
          <Col md={8}>
            <h1 className="form-title">
              <List className="me-3" size={40} />
              Regjistrimi i Matjeve
            </h1>
            <p className="form-subtitle">
              Filloni me regjistrimin e të dhënave të matjes. Mund ta kompletoni porosinë më vonë.
            </p>
          </Col>
          <Col md={4} className="progress-section">
            <Badge bg={progress === 100 ? 'success' : 'primary'} className="mb-2">
              {progress}% Kompletuar
            </Badge>
            <ProgressBar 
              now={progress} 
              variant={progress === 100 ? 'success' : 'primary'}
              className="progress-bar-custom"
            />
          </Col>
        </Row>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="danger" className="modern-alert mb-4">
          <X className="me-2" size={20} />
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="modern-alert mb-4">
          <CheckCircle className="me-2" size={20} />
          {success}
        </Alert>
      )}

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
                    type="tel"
                    name="numriTelefonit"
                    value={formData.numriTelefonit}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shkruani numrin e telefonit"
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
                    placeholder="Lokacioni i dërgimit"
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
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <People className="me-2" size={16} />
                    Matësi <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="matesi"
                    value={formData.matesi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Emri i matësit"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Calendar className="me-2" size={16} />
                    Data e Matjes <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="dataMatjes"
                    value={formData.dataMatjes}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CheckCircle className="me-2" size={16} />
                    Statusi i Matjes
                  </Form.Label>
                  <Form.Select
                    name="statusiMatjes"
                    value={formData.statusiMatjes}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="e pamatur">📏 E Pamatur</option>
                    <option value="e matur">✅ E Matur</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Zgjidhni statusin e duhur të matjes
                  </Form.Text>
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
              <h5 className="mb-0">Detajet Bazë</h5>
            </div>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={12}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <House className="me-2" size={16} />
                    Tipi i Porosisë <span className="required">*</span>
                  </Form.Label>
                  <Form.Select
                    name="tipiPorosise"
                    value={formData.tipiPorosise}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="derë garazhi">🏠 Derë Garazhi</option>
                    <option value="kapak">🔧 Kapgjik</option>
                    <option value="derë garazhi + kapak">🏠🔧 Derë Garazhi + Kapgjik</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <FileText className="me-2" size={16} />
                    Përshkrimi/Shënime
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="pershkrimi"
                    value={formData.pershkrimi}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Shënime për matjen ose porosinë..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Financial Information (Optional) */}
        <Card className="form-section mb-4">
          <Card.Header className="section-header">
            <div className="d-flex align-items-center">
              <CurrencyEuro className="me-2 text-info" size={20} />
              <h5 className="mb-0">Informacionet Financiare</h5>
            </div>
            <small className="text-muted">Këto mund të shtohen kur të kompletoni porosinë</small>
          </Card.Header>
          <Card.Body className="section-body">
            <Row>
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Sasia
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="sasia"
                    value={formData.sasia}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="1"
                  />
                  <Form.Text className="text-muted">
                    Numri i produkteve
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Çmimi për Njësi (€)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="cmimiNjesite"
                    value={formData.cmimiNjesite}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">
                    Çmimi për një produkt
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Çmimi Total (€)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="cmimiTotal"
                    value={formData.cmimiTotal}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">
                    {formData.sasia && formData.cmimiNjesite ? 
                      `${formData.sasia} × ${formData.cmimiNjesite} €` : 
                      'Mund të shtohet më vonë'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Kaparja (€)
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
            </Row>
            
            <Row>
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CurrencyEuro className="me-2" size={16} />
                    Pagesa e Mbetur (€)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.cmimiTotal && formData.kaparja 
                      ? (parseFloat(formData.cmimiTotal) - parseFloat(formData.kaparja)).toFixed(2)
                      : '0.00'
                    }
                    readOnly
                    className="form-input calculated-field"
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
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
              
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CreditCard className="me-2" size={16} />
                    Mënyra e Pagesës
                  </Form.Label>
                  <Form.Select
                    name="menyraPageses"
                    value={formData.menyraPageses}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="kesh">💵 Kesh</option>
                    <option value="banke">🏦 Bankë</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CheckCircle className="me-2" size={16} />
                    Pagesa Përfunduar
                  </Form.Label>
                  <Form.Select
                    name="isPaymentDone"
                    value={formData.isPaymentDone ? 'true' : 'false'}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'isPaymentDone',
                        value: e.target.value === 'true',
                        type: 'select'
                      }
                    })}
                    className="form-input"
                  >
                    <option value="false">❌ Jo</option>
                    <option value="true">✅ Po</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    A është pagesa përfunduar plotësisht?
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Form Actions */}
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
            variant="success" 
            type="submit" 
            disabled={loading || progress < 85} // Allow submission with basic required fields
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
                Ruaj Matjen
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default MeasurementEntryForm; 