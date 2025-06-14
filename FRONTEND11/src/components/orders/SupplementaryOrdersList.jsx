import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  getSupplementaryOrdersByParentId, 
  updateSupplementaryOrderPaymentStatus, 
  deleteSupplementaryOrder,
  addPartialPaymentToSupplementaryOrder,
  markSupplementaryOrderAsPrinted
} from '../../services/supplementaryOrderService';
import { getOrderById } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import PartialPaymentModal from '../payments/PartialPaymentModal';
import SupplementaryOrderInvoice from './SupplementaryOrderInvoice';
import SupplementaryOrderEditForm from './SupplementaryOrderEditForm';

const SupplementaryOrdersList = ({ parentOrderId, onUpdate }) => {
  const { canManagePayments, canEditOrders, canDeleteOrders, isManager, user } = useAuth();
  const [supplementaryOrders, setSupplementaryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Partial payment state
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  
  // Edit order state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  
  // For direct print functionality
  const invoiceRef = useRef();
  const [parentOrders, setParentOrders] = useState({}); // Cache parent orders

  useEffect(() => {
    if (parentOrderId) {
      fetchSupplementaryOrders();
    }
  }, [parentOrderId]);

  const fetchSupplementaryOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getSupplementaryOrdersByParentId(parentOrderId);
      setSupplementaryOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching supplementary orders:', err);
      setError(err.message || 'Gabim gjatë ngarkimit të porosive shtesë');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async (id, isPaid) => {
    try {
      setActionLoading(prev => ({ ...prev, [`payment_${id}`]: true }));
      setError('');
      
      await updateSupplementaryOrderPaymentStatus(id, isPaid);
      
      // Update the order in the state
      setSupplementaryOrders(orders => 
        orders.map(order => 
          order.id === id ? { 
            ...order, 
            isPaymentDone: isPaid
          } : order
        )
      );

      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err.message || 'Gabim gjatë përditësimit të statusit të pagesës');
    } finally {
      setActionLoading(prev => ({ ...prev, [`payment_${id}`]: false }));
    }
  };

  const handlePartialPayment = (order) => {
    setSelectedOrderForPayment(order);
    setShowPartialPaymentModal(true);
  };

  const handlePartialPaymentSuccess = async ({ orderId, paymentAmount, paymentReceiver, isSupplementaryOrder }) => {
    try {
      const result = await addPartialPaymentToSupplementaryOrder(orderId, paymentAmount, paymentReceiver);
      
      // Update the order in the list
      setSupplementaryOrders(orders => 
        orders.map(order => 
          order.id === orderId ? result.supplementaryOrder : order
        )
      );
      
      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
      
      // Show success message
      setError('');
      alert(result.message);
      
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  const handleCancelPayment = async (order) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të anuloni pagesën për këtë porosi shtesë?')) {
      return;
    }
    
    try {
      setActionLoading(prev => ({ ...prev, [`payment_${order.id}`]: true }));
      await updateSupplementaryOrderPaymentStatus(order.id, false);
      
      setSupplementaryOrders(orders => 
        orders.map(o => 
          o.id === order.id ? { ...o, isPaymentDone: false } : o
        )
      );
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë anulimit të pagesës');
    } finally {
      setActionLoading(prev => ({ ...prev, [`payment_${order.id}`]: false }));
    }
  };

  const handleEdit = (order) => {
    setSelectedOrderForEdit(order);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedOrder) => {
    // Update the order in the list
    setSupplementaryOrders(orders => 
      orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    
    // Notify parent component of update
    if (onUpdate) {
      onUpdate();
    }
    
    // Show success message
    setError('');
    alert('Porosia shtesë u përditësua me sukses!');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të fshini këtë porosi shtesë?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: true }));
      setError('');
      
      await deleteSupplementaryOrder(id);
      
      // Remove the order from the state
      setSupplementaryOrders(orders => orders.filter(order => order.id !== id));

      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error deleting supplementary order:', err);
      setError(err.message || 'Gabim gjatë fshirjes së porosisë shtesë');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete_${id}`]: false }));
    }
  };

  const handlePrintInvoice = async (order) => {
    try {
      // Get parent order if not cached
      let parentOrder = parentOrders[order.parentOrderId];
      if (!parentOrder) {
        parentOrder = await getOrderById(order.parentOrderId);
        setParentOrders(prev => ({
          ...prev,
          [order.parentOrderId]: parentOrder
        }));
      }

      // Create a new window for the invoice
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        alert('Pop-up blocked. Please allow pop-ups and try again.');
        return;
      }

      // Create the invoice HTML
      const invoiceHTML = createInvoiceHTML(order, parentOrder, user);
      
      // Write content to print window
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();

      // Mark as printed
      try {
        await markSupplementaryOrderAsPrinted(order.id);
        // Refresh orders to update print status
        fetchSupplementaryOrders();
      } catch (err) {
        console.error('Error marking as printed:', err);
      }

    } catch (err) {
      console.error('Error printing invoice:', err);
      alert('Gabim gjatë printimit të faturës: ' + err.message);
    }
  };

  const createInvoiceHTML = (supplementaryOrder, parentOrder, user) => {
    const totalPrice = parseFloat(supplementaryOrder?.cmimiTotal || 0);
    const downPayment = parseFloat(supplementaryOrder?.kaparja || 0);
    const remainingPayment = totalPrice - downPayment;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LindiDoors Supplementary Invoice #${supplementaryOrder?.id}</title>
        <meta charset="utf-8">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .print-buttons {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            text-align: center;
          }
          .print-buttons button {
            margin: 0 10px;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }
          .btn-primary {
            background-color: #007bff;
            color: white;
          }
          .btn-secondary {
            background-color: #6c757d;
            color: white;
          }
          .invoice-content {
            border: 1px solid #dee2e6;
            padding: 30px;
            background: white;
          }
          @media print {
            .print-buttons { display: none; }
            body { padding: 0; }
            .invoice-container { max-width: none; }
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .company-info h2 {
            color: #007bff;
            margin-bottom: 5px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            color: #343a40;
            margin-bottom: 10px;
          }
          .customer-info, .delivery-info {
            margin-bottom: 25px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .details-table th, .details-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
          }
          .details-table th {
            background-color: #f8f9fa;
          }
          .text-end { text-align: right; }
          .text-center { text-align: center; }
          .mb-3 { margin-bottom: 1rem; }
          .fw-bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="print-buttons">
            <button class="btn-primary" onclick="window.print()">🖨️ Printo</button>
            <button class="btn-secondary" onclick="window.close()">❌ Mbyll</button>
          </div>
          
          <div class="invoice-content">
            <div class="header-row">
              <div class="company-info">
                <h2>LindDoors</h2>
                <p>Management System</p>
                <p>
                  Adresa: Rr. "Lidhja e Prizrenit"<br />
                  Prishtinë, Kosovë<br />
                  Tel: +383 44 123 456<br />
                  Email: info@lindidoors.com
                </p>
              </div>
              <div class="invoice-title">
                <h1>FATURË - POROSI SHTESË</h1>
                <h5>Nr. i Porosisë Shtesë: #${supplementaryOrder?.id || 'N/A'}</h5>
                <p>Data: ${new Date().toLocaleDateString('en-GB')}</p>
                <p>Statusi: ${supplementaryOrder?.statusi || 'N/A'}</p>
                ${parentOrder ? `<p style="color: #007bff;"><small>Lidhur me Porosinë Kryesore #${parentOrder.id}</small></p>` : ''}
              </div>
            </div>

            <div class="customer-info">
              <h5>Klienti:</h5>
              <p>
                <strong>${supplementaryOrder?.emriKlientit || ''} ${supplementaryOrder?.mbiemriKlientit || ''}</strong><br />
                ${supplementaryOrder?.vendi || ''}<br />
                Tel: ${supplementaryOrder?.numriTelefonit || ''}
              </p>
            </div>

            <div class="delivery-info">
              <h5>Detajet e Dërgesës:</h5>
              <p>
                Lokacioni: ${supplementaryOrder?.vendi || ''}<br />
                ${parentOrder ? `
                  Data e Dërgesës: ${parentOrder.dita ? new Date(parentOrder.dita).toLocaleDateString('en-GB') : 'N/A'}<br />
                  Dërguar me: Porosinë Kryesore #${parentOrder.id}
                ` : ''}
              </p>
            </div>

            <table class="details-table">
              <thead>
                <tr>
                  <th>Përshkrimi</th>
                  <th class="text-end">Çmimi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Produkt Shtesë</strong><br />
                    ${supplementaryOrder?.pershkrimiProduktit || ''}
                  </td>
                  <td class="text-end">${totalPrice.toFixed(2)} €</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>Kapari i Paguar</th>
                  <td class="text-end">${downPayment.toFixed(2)} €</td>
                </tr>
                <tr>
                  <th>Total i Mbetur</th>
                  <td class="text-end">${remainingPayment.toFixed(2)} €</td>
                </tr>
                <tr>
                  <th>Totali</th>
                  <td class="text-end"><strong>${totalPrice.toFixed(2)} €</strong></td>
                </tr>
              </tfoot>
            </table>

            <div style="margin-top: 30px;">
              <h5>Shënime:</h5>
              <p>
                Faleminderit për besimin! Kjo porosi shtesë do të dërgohet së bashku me porosinë kryesore 
                për të njëjtin lokacion.
              </p>
              <p>
                <strong>Mënyra e Pagesës: </strong>${supplementaryOrder?.menyraPageses === 'kesh' ? 'Kesh' : 'Bankë'}<br />
                <strong>Pagesa e Përfunduar: </strong>${supplementaryOrder?.isPaymentDone ? 'Po' : 'Jo'}<br />
                ${supplementaryOrder?.kaparaReceiver ? `<strong>Kaparja u mor nga: </strong>${supplementaryOrder.kaparaReceiver}<br />` : ''}
              </p>
              ${parentOrder ? `
                <p style="color: #007bff;">
                  <strong>Shënim:</strong> Kjo porosi shtesë do të dërgohet së bashku me porosinë kryesore 
                  #${parentOrder.id} (${parentOrder?.tipiPorosise || 'N/A'}) në të njëjtin transport.
                </p>
              ` : ''}
              <div style="margin-top: 30px;">
                <p><strong>Nënshkrimi:</strong></p>
                <div style="width: 200px; height: 40px; border-bottom: 1px solid #000;"></div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'në proces':
      case 'borxh': // Treat debt status as "në proces" since debt info is shown in price field
        return <Badge bg="warning">Në Proces</Badge>;
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      default:
        return <Badge bg="secondary">Në Proces</Badge>; // Default to "Në Proces" for any unknown status
    }
  };

  const calculateTotal = () => {
    return supplementaryOrders.reduce((total, order) => {
      return total + parseFloat(order.cmimiTotal || 0);
    }, 0);
  };

  const calculateTotalDebt = () => {
    return supplementaryOrders.reduce((total, order) => {
      if (!order.isPaymentDone) {
        return total + parseFloat(order.pagesaMbetur || 0);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <Card className="mt-3">
        <Card.Header>
          <h6 className="mb-0">Porositë Shtesë</h6>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
          <p className="mt-2 mb-0">Duke ngarkuar porositë shtesë...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h6 className="mb-0">Porositë Shtesë ({supplementaryOrders.length})</h6>
        {supplementaryOrders.length > 0 && (
          <div className="text-end">
            <small className="text-muted">
              Total: {calculateTotal().toFixed(2)} € | 
              Papaguar: {calculateTotalDebt().toFixed(2)} €
            </small>
          </div>
        )}
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="ms-2"
              onClick={fetchSupplementaryOrders}
            >
              Provo përsëri
            </Button>
          </Alert>
        )}

        {supplementaryOrders.length === 0 ? (
          <div className="text-center py-3 text-muted">
            <i className="bi bi-inbox fs-1"></i>
            <p className="mt-2 mb-0">Nuk ka porosi shtesë për këtë porosi.</p>
          </div>
        ) : (
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Klienti</th>
                <th>Produkti</th>
                <th>Çmimi</th>
                <th>Statusi</th>
                <th>Veprime</th>
              </tr>
            </thead>
            <tbody>
              {supplementaryOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong><br/>
                    <small className="text-muted">{order.numriTelefonit}</small>
                  </td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={order.pershkrimiProduktit}>
                      {order.pershkrimiProduktit}
                    </div>
                    {order.kaparaReceiver && (
                      <small className="text-muted">
                        Kaparja nga: {order.kaparaReceiver}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{parseFloat(order.cmimiTotal).toFixed(2)} €</strong><br/>
                    <small>
                      {order.isPaymentDone ? 
                        <Badge bg="success">Paguar</Badge> : 
                        <Badge bg="danger">Mbetur: {parseFloat(order.pagesaMbetur).toFixed(2)} €</Badge>
                      }
                    </small>
                  </td>
                  <td>{getStatusBadge(order.statusi)}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {canEditOrders && (
                        <Button 
                          variant="info" 
                          size="sm" 
                          onClick={() => handleEdit(order)}
                          disabled={actionLoading[`edit_${order.id}`]}
                        >
                          <i className="bi bi-pencil"></i> Edito
                        </Button>
                      )}
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handlePrintInvoice(order)}
                        title={order.eshtePrintuar ? "Printo Përsëri" : "Printo Faturën Shtesë"}
                      >
                        <i className="bi bi-printer"></i> {order.eshtePrintuar ? "Printo Përsëri" : "Printo"}
                      </Button>
                      
                      {!order.isPaymentDone && canManagePayments && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          onClick={() => handlePartialPayment(order)}
                          disabled={actionLoading[`payment_${order.id}`]}
                        >
                          {actionLoading[`payment_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Paguaj'}
                        </Button>
                      )}
                      
                      {!order.isPaymentDone && !canManagePayments && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          disabled
                          title="Vetëm administratori mund të menaxhojë pagesat"
                        >
                          Paguaj
                        </Button>
                      )}
                      
                      {order.isPaymentDone && canManagePayments && (
                        <Button 
                          variant="warning" 
                          size="sm" 
                          onClick={() => handleCancelPayment(order)}
                          disabled={actionLoading[`payment_${order.id}`]}
                        >
                          {actionLoading[`payment_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Anulo'}
                        </Button>
                      )}
                      
                      {canDeleteOrders && (
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(order.id)}
                          disabled={actionLoading[`delete_${order.id}`]}
                        >
                          {actionLoading[`delete_${order.id}`] ? (
                            <Spinner animation="border" size="sm" />
                          ) : 'Fshi'}
                        </Button>
                      )}
                      
                      {isManager && !canDeleteOrders && (
                        <small className="text-muted align-self-center">
                          Editim i kufizuar
                        </small>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
      
      {/* Partial Payment Modal */}
      <PartialPaymentModal
        show={showPartialPaymentModal}
        onHide={() => {
          setShowPartialPaymentModal(false);
          setSelectedOrderForPayment(null);
        }}
        supplementaryOrder={selectedOrderForPayment}
        onPaymentSuccess={handlePartialPaymentSuccess}
      />
      
      {/* Edit Supplementary Order Modal */}
      <SupplementaryOrderEditForm
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedOrderForEdit(null);
        }}
        supplementaryOrder={selectedOrderForEdit}
        parentOrder={parentOrders[selectedOrderForEdit?.parentOrderId]}
        onSuccess={handleEditSuccess}
      />
    </Card>
  );
};

export default SupplementaryOrdersList; 