import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { 
  CurrencyEuro, 
  CreditCard, 
  CheckCircle, 
  Save,
  X,
  InfoCircle,
  People,
  Person,
  Telephone,
  GeoAlt,
  Calendar,
  FileText,
  House,
  List,
  Tools,
  Truck
} from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getOrderById, updateOrder } from '../../services/orderService';
import './OrderForm.css';

// Add inline styles for this component
const styles = `
  .readonly-field {
    background-color: #f8f9fa !important;
    border: 1px solid #e9ecef !important;
    color: #6c757d !important;
  }
  
  .calculation-display {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 1rem;
    margin-top: 1rem;
  }
  
  .calculation-title {
    color: #495057;
    margin-bottom: 0.5rem;
  }
  
  .calculation-item {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .calculation-item .result {
    color: #28a745;
    font-weight: bold;
    margin-left: 0.5rem;
  }
`;

const OrderCompletionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalOrder, setOriginalOrder] = useState(null);
  
  // Using the same field names as OrderForm for consistency
  const [formData, setFormData] = useState({
    sasia: '1', // Quantity field
    cmimiNjesite: '', // Unit price field
    cmimiTotal: '',
    kaparja: '0',
    kaparaReceiver: '',
    sender: '',
    installer: '',
    menyraPageses: 'kesh',
    isPaymentDone: false,
    pershkrimi: '', // Allow updating description
    // Keep existing measurement and customer data (will be populated from original order)
    emriKlientit: '',
    mbiemriKlientit: '',
    numriTelefonit: '',
    vendi: '',
    shitesi: '',
    matesi: '',
    dataMatjes: '',
    dita: '',
    tipiPorosise: '',
    statusiMatjes: '',
    gjatesia: '',
    gjeresia: '',
    profiliLarte: '',
    profiliPoshtem: ''
  });
  
  // Calculated field
  const pagesaMbetur = formData.cmimiTotal && formData.kaparja 
    ? parseFloat(formData.cmimiTotal) - parseFloat(formData.kaparja) 
    : 0;

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

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const orderData = await getOrderById(id);
      setOriginalOrder(orderData);
      
      // Pre-fill form with existing data
      setFormData({
        // Financial data (mostly empty, to be completed)
        sasia: orderData.sasia || '1',
        cmimiNjesite: orderData.cmimiNjesite || '',
        cmimiTotal: orderData.cmimiTotal || '',
        kaparja: orderData.kaparja || '0',
        kaparaReceiver: orderData.kaparaReceiver || '',
        menyraPageses: orderData.menyraPageses || 'kesh',
        isPaymentDone: orderData.isPaymentDone || false,
        
        // Personnel data (to be completed)
        sender: orderData.sender || '',
        installer: orderData.installer || '',
        
        // Existing data (read-only display)
        emriKlientit: orderData.emriKlientit || '',
        mbiemriKlientit: orderData.mbiemriKlientit || '',
        numriTelefonit: orderData.numriTelefonit || '',
        vendi: orderData.vendi || '',
        shitesi: orderData.shitesi || '',
        matesi: orderData.matesi || '',
        dataMatjes: orderData.dataMatjes || '',
        dita: orderData.dita || '',
        tipiPorosise: orderData.tipiPorosise || '',
        statusiMatjes: orderData.statusiMatjes || '',
        gjatesia: orderData.gjatesia || '',
        gjeresia: orderData.gjeresia || '',
        profiliLarte: orderData.profiliLarte || '',
        profiliPoshtem: orderData.profiliPoshtem || '',
        pershkrimi: orderData.pershkrimi || ''
      });
      
      setLoading(false);
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë ngarkimit të porosisë');
      setLoading(false);
    }
  };

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
    
    // Validate required financial fields
    if (!formData.cmimiTotal) {
      setError('Ju lutem plotësoni çmimin total!');
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare update data - only send fields that can be updated
      const updateData = {
        sasia: formData.sasia,
        cmimiNjesite: formData.cmimiNjesite,
        cmimiTotal: formData.cmimiTotal,
        kaparja: formData.kaparja,
        kaparaReceiver: formData.kaparaReceiver,
        menyraPageses: formData.menyraPageses,
        isPaymentDone: formData.isPaymentDone,
        sender: formData.sender,
        installer: formData.installer,
        pershkrimi: formData.pershkrimi,
        dita: formData.dita,
        // Include measurement information updates
        matesi: formData.matesi,
        dataMatjes: formData.dataMatjes,
        statusiMatjes: formData.statusiMatjes,
        // Include dimension updates
        gjatesia: formData.gjatesia || null,
        gjeresia: formData.gjeresia || null,
        profiliLarte: formData.profiliLarte || 0,
        profiliPoshtem: formData.profiliPoshtem || 0,
        // Mark as complete by removing the incomplete flag
        isIncomplete: false
      };
      
      await updateOrder(id, updateData);
      
      setSuccess('Porosia u kompletua me sukses!');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ka ndodhur një gabim gjatë kompletimit të porosisë');
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ['cmimiTotal'];
    const optionalFields = ['kaparja', 'kaparaReceiver', 'sender', 'installer', 'gjatesia', 'gjeresia'];
    const allFields = [...requiredFields, ...optionalFields];
    
    const completedRequired = requiredFields.filter(field => 
      formData[field] && formData[field].toString().trim() !== ''
    ).length;
    
    const completedOptional = optionalFields.filter(field => 
      formData[field] && formData[field].toString().trim() !== ''
    ).length;
    
    // Required fields count as 60%, optional as 40%
    const requiredProgress = (completedRequired / requiredFields.length) * 60;
    const optionalProgress = (completedOptional / optionalFields.length) * 40;
    
    return Math.round(requiredProgress + optionalProgress);
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Duke ngarkuar...</span>
        </div>
      </Container>
    );
  }

  if (!originalOrder) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          Porosia nuk u gjet!
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="order-form-container">
      {/* Inject custom styles */}
      <style>{styles}</style>
      
      {/* Header */}
      <Card className="form-header mb-4">
        <Row>
          <Col md={8}>
            <h1 className="form-title">
              <CheckCircle className="me-3" size={40} />
              Kompletimi i Porosisë #{id}
            </h1>
            <p className="form-subtitle">
              Kompletoni informacionet e mbetura për të finalizuar porosinë.
            </p>
          </Col>
          <Col md={4} className="progress-section">
            <Badge bg={progress === 100 ? 'success' : 'warning'} className="mb-2">
              {progress}% Kompletuar
            </Badge>
            <ProgressBar 
              now={progress} 
              variant={progress === 100 ? 'success' : 'warning'}
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
                    Emri i Klientit
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.emriKlientit}
                    readOnly
                    className="form-input readonly-field"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Person className="me-2" size={16} />
                    Mbiemri i Klientit
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.mbiemriKlientit}
                    readOnly
                    className="form-input readonly-field"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <Telephone className="me-2" size={16} />
                    Numri i Telefonit
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.numriTelefonit}
                    readOnly
                    className="form-input readonly-field"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <GeoAlt className="me-2" size={16} />
                    Vendi
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.vendi}
                    readOnly
                    className="form-input readonly-field"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <People className="me-2" size={16} />
                    Shitësi
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.shitesi}
                    readOnly
                    className="form-input readonly-field"
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
            <small className="text-muted">Mund t'i përditësoni këto informacione gjatë kompletimit</small>
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
                    value={formData.matesi || ''}
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
                    value={formData.dataMatjes ? formData.dataMatjes.split('T')[0] : ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
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
                    Përditësoni statusin e matjes nëse është ndryshuar
                  </Form.Text>
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
              <Col md={3}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <List className="me-2" size={16} />
                    Sasia <span className="required">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="sasia"
                    value={formData.sasia}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="1"
                    required
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
                  <Form.Text className="text-muted">
                    {formData.sasia && formData.cmimiNjesite ? 
                      `${formData.sasia} × ${formData.cmimiNjesite} €` : 
                      'Çmimi total'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={3}>
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
            </Row>
            
            <Row>
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
              
              <Col md={4}>
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
              
              <Col md={4}>
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
            
            <Row>
              <Col md={6}>
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
                    value={formData.dita || format(new Date(), 'yyyy-MM-dd')}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                  <Form.Text className="text-muted">
                    <InfoCircle className="me-1" size={12} />
                    Data e prodhimit/dorëzimit të porosisë
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <House className="me-2" size={16} />
                    Tipi i Porosisë
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.tipiPorosise === 'derë garazhi' ? '🏠 Derë Garazhi' : '🔧 Kapgjik'}
                    readOnly
                    className="form-input readonly-field"
                  />
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
                    value={formData.gjatesia || ''}
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
                    value={formData.gjeresia || ''}
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
                    value={formData.profiliLarte || '0'}
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
                    value={formData.profiliPoshtem || '0'}
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

        {/* Form Actions */}
        <div className="form-actions">
          <Button 
            variant="outline-secondary" 
            className="action-btn cancel-btn me-3" 
            onClick={() => navigate('/orders/incomplete')}
            disabled={saving}
          >
            <X className="me-2" size={16} />
            Anulo
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={saving || !formData.cmimiTotal}
            className="action-btn submit-btn"
          >
            {saving ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Duke Ruajtur...
              </>
            ) : (
              <>
                <CheckCircle className="me-2" size={16} />
                Kompletoj Porosinë
              </>
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default OrderCompletionForm; 