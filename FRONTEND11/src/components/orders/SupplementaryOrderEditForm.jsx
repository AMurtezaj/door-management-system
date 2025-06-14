import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { InfoCircle, CurrencyEuro, Person, CreditCard } from 'react-bootstrap-icons';
import * as supplementaryOrderService from '../../services/supplementaryOrderService';
import { useAuth } from '../../context/AuthContext';

const SupplementaryOrderEditForm = ({ show, onHide, supplementaryOrder, parentOrder, onSuccess }) => {
  const { isAdmin, isManager } = useAuth();
  const [formData, setFormData] = useState({
    emriKlientit: '',
    mbiemriKlientit: '',
    numriTelefonit: '',
    vendi: '',
    pershkrimiProduktit: '',
    cmimiTotal: '',
    kaparja: '',
    kaparaReceiver: '',
    menyraPageses: 'kesh',
    isPaymentDone: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form data when supplementary order changes
  useEffect(() => {
    if (supplementaryOrder) {
      setFormData({
        emriKlientit: supplementaryOrder.emriKlientit || '',
        mbiemriKlientit: supplementaryOrder.mbiemriKlientit || '',
        numriTelefonit: supplementaryOrder.numriTelefonit || '',
        vendi: supplementaryOrder.vendi || '',
        pershkrimiProduktit: supplementaryOrder.pershkrimiProduktit || '',
        cmimiTotal: supplementaryOrder.cmimiTotal || '',
        kaparja: supplementaryOrder.kaparja || '',
        kaparaReceiver: supplementaryOrder.kaparaReceiver || '',
        menyraPageses: supplementaryOrder.menyraPageses || 'kesh',
        isPaymentDone: supplementaryOrder.isPaymentDone || false
      });
    }
  }, [supplementaryOrder]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!supplementaryOrder) {
      setError('Porosia shtesë nuk është zgjedhur!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Validate required fields
      const requiredFields = ['emriKlientit', 'mbiemriKlientit', 'numriTelefonit', 'vendi', 'pershkrimiProduktit'];
      
      // Only validate financial fields if user is admin
      if (isAdmin) {
        requiredFields.push('cmimiTotal');
      }
      
      for (const field of requiredFields) {
        if (!formData[field]) {
          throw new Error(`Fusha "${field}" është e detyrueshme!`);
        }
      }

      // Only validate financial fields if user is admin
      if (isAdmin) {
        if (isNaN(parseFloat(formData.cmimiTotal)) || parseFloat(formData.cmimiTotal) <= 0) {
          throw new Error('Çmimi total duhet të jetë një numër pozitiv!');
        }

        if (formData.kaparja && (isNaN(parseFloat(formData.kaparja)) || parseFloat(formData.kaparja) < 0)) {
          throw new Error('Kaparja duhet të jetë një numër pozitiv ose zero!');
        }

        // Validate that advance payment doesn't exceed total price
        const total = parseFloat(formData.cmimiTotal);
        const advance = parseFloat(formData.kaparja || 0);
        if (advance > total) {
          throw new Error('Kaparja nuk mund të jetë më e madhe se çmimi total!');
        }
      }

      // Prepare data for submission
      const updateData = { ...formData };
      
      // Only include financial data if user is admin
      if (isAdmin) {
        const total = parseFloat(formData.cmimiTotal);
        const advance = parseFloat(formData.kaparja || 0);
        updateData.cmimiTotal = total;
        updateData.kaparja = advance;
        updateData.pagesaMbetur = total - advance;
      } else {
        // For managers, exclude financial fields from update
        delete updateData.cmimiTotal;
        delete updateData.kaparja;
        delete updateData.kaparaReceiver;
        delete updateData.menyraPageses;
        delete updateData.isPaymentDone;
      }

      const result = await supplementaryOrderService.updateSupplementaryOrder(supplementaryOrder.id, updateData);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Close modal
      onHide();
    } catch (err) {
      console.error('Error updating supplementary order:', err);
      setError(err.message || 'Gabim gjatë përditësimit të porosisë shtesë');
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingPayment = () => {
    const total = parseFloat(formData.cmimiTotal || 0);
    const advance = parseFloat(formData.kaparja || 0);
    return Math.max(0, total - advance).toFixed(2);
  };

  return (
    <Modal 
      show={show} 
      onHide={loading ? null : onHide} 
      size="lg"
      backdrop={loading ? 'static' : true}
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          Edito Porosinë Shtesë #{supplementaryOrder?.id}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {isManager && (
            <Alert variant="info" className="mb-3">
              <InfoCircle className="me-2" size={16} />
              <strong>Njoftim për Menaxherin:</strong> Ju mund të editoni të gjitha informacionet e porosisë shtesë përveç të dhënave financiare. Informacionet financiare janë të rezervuara vetëm për administratorët.
            </Alert>
          )}

          {parentOrder && (
            <Alert variant="info" className="mb-3">
              <strong>Porosia Kryesore:</strong> {parentOrder.tipiPorosise} - {parentOrder.emriKlientit} {parentOrder.mbiemriKlientit}<br />
              <strong>Lokacioni:</strong> {parentOrder.vendi}<br />
              <small>Porosia shtesë do të dërgohet në të njëjtin lokacion.</small>
            </Alert>
          )}

          {/* Customer Information Section */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Emri i Klientit *</Form.Label>
                <Form.Control
                  type="text"
                  name="emriKlientit"
                  value={formData.emriKlientit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mbiemri i Klientit *</Form.Label>
                <Form.Control
                  type="text"
                  name="mbiemriKlientit"
                  value={formData.mbiemriKlientit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Numri i Telefonit *</Form.Label>
                <Form.Control
                  type="tel"
                  name="numriTelefonit"
                  value={formData.numriTelefonit}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lokacioni *</Form.Label>
                <Form.Control
                  type="text"
                  name="vendi"
                  value={formData.vendi}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  Lokacioni duhet të jetë i njëjtë me porosinë kryesore
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Përshkrimi i Produktit *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="pershkrimiProduktit"
                  value={formData.pershkrimiProduktit}
                  onChange={handleChange}
                  placeholder="P.sh. Keramika për banjo, Dysheme laminat, etj."
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Financial Information Section */}
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <CurrencyEuro className="me-2 text-warning" size={20} />
              <h6 className="mb-0">Informacionet Financiare</h6>
              {isManager && (
                <small className="text-muted ms-2">
                  <InfoCircle className="me-1" size={12} />
                  Vetëm administratorët mund të editojnë informacionet financiare
                </small>
              )}
            </div>
            
            {isManager && (
              <Alert variant="info" className="mb-3">
                <InfoCircle className="me-2" size={16} />
                <strong>Njoftim për Menaxherin:</strong> Këto fusha janë vetëm për lexim. Vetëm administratorët mund të modifikojnë informacionet financiare.
              </Alert>
            )}

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <CurrencyEuro className="me-2" size={16} />
                    Çmimi Total (€) *
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="cmimiTotal"
                    value={formData.cmimiTotal}
                    onChange={handleChange}
                    required={isAdmin}
                    disabled={loading || isManager}
                    className={isManager ? 'bg-light' : ''}
                    readOnly={isManager}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <CurrencyEuro className="me-2" size={16} />
                    Kaparja (€)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="kaparja"
                    value={formData.kaparja}
                    onChange={handleChange}
                    disabled={loading || isManager}
                    className={isManager ? 'bg-light' : ''}
                    readOnly={isManager}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <CurrencyEuro className="me-2" size={16} />
                    Pagesa e Mbetur (€)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={calculateRemainingPayment()}
                    disabled
                    className="bg-light"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <Person className="me-2" size={16} />
                    Personi që Mori Kaparën
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="kaparaReceiver"
                    value={formData.kaparaReceiver}
                    onChange={handleChange}
                    disabled={loading || isManager}
                    className={isManager ? 'bg-light' : ''}
                    readOnly={isManager}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <CreditCard className="me-2" size={16} />
                    Mënyra e Pagesës *
                  </Form.Label>
                  <Form.Select
                    name="menyraPageses"
                    value={formData.menyraPageses}
                    onChange={handleChange}
                    required={isAdmin}
                    disabled={loading || isManager}
                    className={isManager ? 'bg-light' : ''}
                  >
                    <option value="kesh">Kesh</option>
                    <option value="banke">Bankë</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Pagesa Përfunduar</Form.Label>
                  <Form.Select
                    name="isPaymentDone"
                    value={formData.isPaymentDone ? 'true' : 'false'}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'isPaymentDone',
                        type: 'select',
                        value: e.target.value === 'true'
                      }
                    })}
                    disabled={loading || isManager}
                    className={isManager ? 'bg-light' : ''}
                  >
                    <option value="false">❌ Jo</option>
                    <option value="true">✅ Po</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {isManager ? 
                      'Vetëm administratorët mund të ndryshojnë statusin e pagesës' :
                      'Zgjidhni "Po" nëse pagesa është kryer plotësisht'
                    }
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Anulo
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner 
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Duke ruajtur...
              </>
            ) : 'Ruaj Ndryshimet'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SupplementaryOrderEditForm; 