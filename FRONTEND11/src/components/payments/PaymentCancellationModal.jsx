import React, { useState } from 'react';
import { Modal, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { CurrencyEuro, ExclamationTriangleFill, ArrowCounterclockwise } from 'react-bootstrap-icons';

const PaymentCancellationModal = ({ 
  show, 
  onHide, 
  order, 
  onCancellationSuccess 
}) => {
  const [cancellationAmount, setCancellationAmount] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!order) return null;

  const totalPaid = parseFloat(order.kaparja || 0);
  const totalAmount = parseFloat(order.cmimiTotal || 0);
  const currentDebt = totalAmount - totalPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amountToCancel = parseFloat(cancellationAmount);
    
    // Validation
    if (!amountToCancel || amountToCancel <= 0) {
      setError('Ju lutem vendosni një shumë të vlefshme për anulim');
      return;
    }

    if (amountToCancel > totalPaid) {
      setError(`Nuk mund të anuloni më shumë se sa është paguar (€${totalPaid.toFixed(2)})`);
      return;
    }

    try {
      setProcessing(true);
      
      // Calculate new payment amounts
      const newKaparja = totalPaid - amountToCancel;
      const newDebt = totalAmount - newKaparja;
      const isStillFullyPaid = newDebt <= 0.01; // Consider paid if debt is negligible

      await onCancellationSuccess({
        orderId: order.id,
        cancellationAmount: amountToCancel,
        newKaparja,
        newDebt,
        isPaymentDone: isStillFullyPaid
      });

      // Reset form and close modal
      setCancellationAmount('');
      onHide();
      
    } catch (err) {
      setError(err.message || 'Ka ndodhur një gabim gjatë anulimit të pagesës');
    } finally {
      setProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCancellationAmount(value);
      setError('');
    }
  };

  const handleFullCancellation = () => {
    setCancellationAmount(totalPaid.toString());
    setError('');
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>
          <ArrowCounterclockwise className="me-2" />
          Anulo Pagesën
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Order Information */}
          <Alert variant="info" className="mb-3">
            <div>
              <strong>Porosia:</strong> {order.emriKlientit} {order.mbiemriKlientit}
            </div>
            <div className="mt-2">
              <div><strong>Çmimi Total:</strong> €{totalAmount.toFixed(2)}</div>
              <div><strong>Paguar Aktualisht:</strong> €{totalPaid.toFixed(2)}</div>
              <div><strong>Borxh Aktual:</strong> €{currentDebt.toFixed(2)}</div>
            </div>
          </Alert>

          {error && (
            <Alert variant="danger">
              <ExclamationTriangleFill className="me-2" />
              {error}
            </Alert>
          )}

          {/* Cancellation Amount Input */}
          <Form.Group className="mb-3">
            <Form.Label>
              <CurrencyEuro className="me-2" size={16} />
              Shuma për Anulim <span className="text-danger">*</span>
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                value={cancellationAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                required
                disabled={processing}
              />
              <InputGroup.Text>€</InputGroup.Text>
            </InputGroup>
            <Form.Text className="text-muted">
              Maksimumi: €{totalPaid.toFixed(2)} (shuma e paguar)
            </Form.Text>
          </Form.Group>

          {/* Quick Action Buttons */}
          <div className="d-flex gap-2 mb-3">
            <Button
              variant="outline-warning"
              size="sm"
              onClick={handleFullCancellation}
              disabled={processing}
            >
              Anulo Të Gjitha (€{totalPaid.toFixed(2)})
            </Button>
          </div>

          {/* Preview of Changes */}
          {cancellationAmount && parseFloat(cancellationAmount) > 0 && parseFloat(cancellationAmount) <= totalPaid && (
            <Alert variant="light" className="border">
              <h6>Parashikimi i Ndryshimeve:</h6>
              <div className="row">
                <div className="col-6">
                  <div><strong>Paguar Pas Anulimit:</strong></div>
                  <div className="text-primary">€{(totalPaid - parseFloat(cancellationAmount)).toFixed(2)}</div>
                </div>
                <div className="col-6">
                  <div><strong>Borxh i Ri:</strong></div>
                  <div className="text-danger">€{(totalAmount - (totalPaid - parseFloat(cancellationAmount))).toFixed(2)}</div>
                </div>
              </div>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={processing}>
            Anulo
          </Button>
          <Button 
            variant="warning" 
            type="submit" 
            disabled={processing || !cancellationAmount || parseFloat(cancellationAmount) <= 0}
          >
            {processing ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Duke Anuluar...
              </>
            ) : (
              <>
                <ArrowCounterclockwise className="me-2" size={16} />
                Anulo Pagesën
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PaymentCancellationModal; 