import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Badge, ProgressBar, Modal, ListGroup, Toast, ToastContainer } from 'react-bootstrap';
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
  InfoCircle,
  PencilSquare,
  ExclamationTriangleFill,
  ArrowRepeat
} from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { sq } from 'date-fns/locale';
import { getOrderById, updateOrder } from '../../services/orderService';
import { getAllCapacities } from '../../services/capacityService';
import useOrderManagement from '../../hooks/useOrderManagement';
import './OrderForm.css';

const OrderEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Use order management hook for date editing capabilities
  const {
    checkCapacityForDate,
    rescheduleOrderWithNotification
  } = useOrderManagement();
  
  // Date change modal state
  const [showDateChangeModal, setShowDateChangeModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [dateChangeLoading, setDateChangeLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  
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
    eshtePrintuar: false,
    statusiMatjes: 'e pamatur',
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
  
  const showToastNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };
  
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
  
  // Handle date change with capacity checking
  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    
    if (!selectedDate) {
      setFormData(prev => ({ ...prev, dita: selectedDate }));
      return;
    }
    
    try {
      // Check capacity for the new date
      const capacityCheck = await checkCapacityForDate(selectedDate, formData.tipiPorosise);
      
      if (capacityCheck.hasCapacity) {
        // Date has capacity, update and save immediately
        const updatedFormData = { ...formData, dita: selectedDate };
        setFormData(updatedFormData);
        
        try {
          // Save to database immediately
          await updateOrder(id, updatedFormData);
          showToastNotification(
            `Data u ndryshua dhe u ruajt me sukses në ${format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: sq })}`, 
            'success'
          );
        } catch (saveError) {
          console.error('Auto-save failed:', saveError);
          // Reset the date field to original value since save failed
          setFormData(prev => ({ ...prev, dita: formData.dita }));
          showToastNotification(
            `Gabim: Nuk mund të ruhet data e re në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${saveError.message}`,
            'danger'
          );
        }
      } else {
        // No capacity, show warning and suggest alternatives
        setNewDate(selectedDate);
        setShowDateChangeModal(true);
        
        // Find alternative dates with capacity
        const alternatives = [];
        for (const capacity of capacities) {
          if (capacity.dita !== formData.dita) { // Don't include current date
            try {
              const altCapacityCheck = await checkCapacityForDate(capacity.dita, formData.tipiPorosise);
              if (altCapacityCheck.hasCapacity) {
                alternatives.push(capacity.dita);
              }
            } catch (error) {
              console.warn(`Could not check capacity for ${capacity.dita}:`, error);
              // Include anyway as potential option
              if ((formData.tipiPorosise === 'derë garazhi' && capacity.dyerGarazhi > 0) ||
                  (formData.tipiPorosise === 'kapak' && capacity.kapake > 0)) {
                alternatives.push(capacity.dita);
              }
            }
          }
        }
        
        setAvailableDates(alternatives.slice(0, 10)); // Limit to 10 alternatives
      }
    } catch (error) {
      console.warn('Capacity check failed, attempting to save anyway:', error);
      
      // Try to save even if capacity check failed
      const updatedFormData = { ...formData, dita: selectedDate };
      setFormData(updatedFormData);
      
      try {
        await updateOrder(id, updatedFormData);
        showToastNotification(
          `Data u ndryshua dhe u ruajt me sukses në ${format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: sq })} (kontrolli i kapacitetit nuk ishte i disponueshëm)`, 
          'warning'
        );
      } catch (saveError) {
        console.error('Save failed after capacity check failure:', saveError);
        // Reset the date field to original value since save failed
        setFormData(prev => ({ ...prev, dita: formData.dita }));
        showToastNotification(
          `Gabim: Nuk mund të ruhet data e re në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${saveError.message}`,
          'danger'
        );
      }
    }
  };
  
  // Force date change despite capacity warning
  const forceDateChange = async () => {
    try {
      // Update the form data first
      const updatedFormData = { ...formData, dita: newDate };
      setFormData(updatedFormData);
      
      // Save the changes directly to the database
      await updateOrder(id, updatedFormData);
      
      setShowDateChangeModal(false);
      showToastNotification(
        `Data u ndryshua dhe u ruajt në ${format(parseISO(newDate), 'dd/MM/yyyy', { locale: sq })} (paralajmërim: kapaciteti mund të jetë i plotë)`, 
        'warning'
      );
    } catch (error) {
      console.error('Force date change save failed:', error);
      
      // No local fallback - show clear error message
      setShowDateChangeModal(false);
      showToastNotification(
        `Gabim: Nuk mund të ruhet data e re në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${error.message}`,
        'danger'
      );
    }
  };
  
  // Use smart rescheduling
  const useSmartReschedule = async (alternativeDate) => {
    try {
      setDateChangeLoading(true);
      
      // Update the form data first
      const updatedFormData = { ...formData, dita: alternativeDate };
      setFormData(updatedFormData);
      
      // Save the changes directly to the database
      await updateOrder(id, updatedFormData);
      
      // Also try to use the reschedule notification system (optional)
      try {
        await rescheduleOrderWithNotification(
          parseInt(id), 
          alternativeDate, 
          'Riplanifikuar nga forma e editimit për shkak të kapacitetit'
        );
      } catch (notificationError) {
        console.warn('Notification creation failed:', notificationError);
        // Continue even if notification fails
      }
      
      setShowDateChangeModal(false);
      showToastNotification(
        `Porosia u riplanifikua dhe u ruajt me sukses në ${format(parseISO(alternativeDate), 'dd/MM/yyyy', { locale: sq })}`,
        'success'
      );
      
    } catch (error) {
      console.error('Smart reschedule failed:', error);
      
      // No local fallback - show clear error message
      setShowDateChangeModal(false);
      showToastNotification(
        `Gabim: Nuk mund të ruhet data e re në bazën e të dhënave. Ju lutem kontrolloni lidhjen dhe provoni përsëri. Detaje: ${error.message}`,
        'danger'
      );
    } finally {
      setDateChangeLoading(false);
    }
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
      showToastNotification('Porosia u përditësua me sukses!', 'success');
      
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
      showToastNotification('Gabim gjatë përditësimit të porosisë', 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="order-form-container py-4">
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Duke ngarkuar...</span>
          </div>
          <p className="mt-3 text-muted">Duke ngarkuar të dhënat e porosisë...</p>
        </div>
      </Container>
    );
  }

  const progress = calculateProgress();
  
  return (
    <Container className="order-form-container py-4">
      <div className="form-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="form-title mb-2">
              <PencilSquare className="me-3 text-primary" size={32} />
              Edito Porosinë #{id}
            </h2>
            <p className="form-subtitle text-muted">
              Përditëso informacionet e porosisë ekzistuese
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
                    value={formData.dataMatjes || ''}
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
                    value={formData.kaparaReceiver || ''}
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
                    value={formData.sender || ''}
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
                    value={formData.installer || ''}
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
                    onChange={handleDateChange}
                    className="form-input"
                    required
                  />
                  <Form.Text className="text-muted">
                    <InfoCircle className="me-1" size={12} />
                    Klikoni këtu për të ndryshuar datën. Sistemi do të kontrollojë kapacitetin automatikisht.
                  </Form.Text>
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
              <Col md={6}>
                <Form.Group className="form-group mb-3">
                  <Form.Label className="form-label">
                    <CheckCircle className="me-2" size={16} />
                    Statusi i Porosisë
                  </Form.Label>
                  <Form.Select
                    name="statusi"
                    value={formData.statusi}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="në proces">🔄 Në Proces</option>
                    <option value="e përfunduar">✅ E Përfunduar</option>
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
                    value={formData.pershkrimi || ''}
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
                Ruaj Ndryshimet
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* Date Change Modal */}
      <Modal show={showDateChangeModal} onHide={() => setShowDateChangeModal(false)} centered>
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title>
            <ExclamationTriangleFill className="me-2 text-warning" />
            Paralajmërim Kapaciteti
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          <Alert variant="warning">
            <ExclamationTriangleFill className="me-2" />
            <strong>Data e zgjedhur ({newDate ? format(parseISO(newDate), 'dd/MM/yyyy', { locale: sq }) : ''}) nuk ka kapacitet të disponueshëm</strong>
            <br />
            <small>Lloji i porosisë: {formData.tipiPorosise}</small>
          </Alert>
          
          <p>Zgjidhni një nga opsionet e mëposhtme:</p>
          
          <div className="mb-3">
            <Button
              variant="outline-warning"
              className="w-100 mb-2"
              onClick={forceDateChange}
            >
              <Calendar className="me-2" />
              Vazhdo me datën e zgjedhur (mund të ketë probleme kapaciteti)
            </Button>
            
            <hr />
            
            <h6>Ose zgjidhni një datë alternative me kapacitet:</h6>
            {availableDates.length > 0 ? (
              <ListGroup>
                {availableDates.map(date => (
                  <ListGroup.Item 
                    key={date} 
                    action 
                    onClick={() => useSmartReschedule(date)}
                    disabled={dateChangeLoading}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <Calendar className="me-2" />
                      {format(parseISO(date), 'dd/MM/yyyy EEEE', { locale: sq })}
                    </div>
                    <ArrowRepeat className="text-primary" />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <Alert variant="info">
                <InfoCircle className="me-2" />
                Nuk ka data alternative të disponueshme me kapacitet. Ju lutem zgjidhni datën manuale.
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDateChangeModal(false)}
            disabled={dateChangeLoading}
          >
            Anulo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer className="position-fixed" style={{ top: '20px', right: '20px', zIndex: 9999 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={4000} 
          autohide
          bg={toastVariant}
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto text-white">
              {toastVariant === 'success' ? 'Sukses' : toastVariant === 'danger' ? 'Gabim' : 'Informacion'}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default OrderEdit; 