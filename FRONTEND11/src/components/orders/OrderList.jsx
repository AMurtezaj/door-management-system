import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getAllOrders, updatePaymentStatus, deleteOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import PrintInvoiceModal from './PrintInvoiceModal';
import SupplementaryOrderForm from './SupplementaryOrderForm';
import DimensionManager from './DimensionManager';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, inProcess, completed, debt, unpaid
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated, refreshAuth, canEditOrders, canManagePayments, isManager } = useAuth();
  
  // Print invoice state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Supplementary order state
  const [showSupplementaryForm, setShowSupplementaryForm] = useState(false);
  const [selectedParentOrder, setSelectedParentOrder] = useState(null);
  
  // Fetch orders on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders...');
      const data = await getAllOrders();
      console.log(`Successfully fetched ${data.length} orders`);
      console.log('First order data sample:', data[0]);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(`Ka ndodhur një gabim gjatë marrjes së porosive: ${err.message || 'Gabim i panjohur'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePaymentUpdate = async (id, isPaid) => {
    try {
      setError('');
      console.log(`Updating payment status for order ${id} to ${isPaid ? 'paid' : 'unpaid'}`);
      await updatePaymentStatus(id, isPaid);
      console.log('Payment status updated successfully');
      
      // Update the order in the state
      setOrders(orders.map(order => 
        order.id === id ? { 
          ...order, 
          isPaymentDone: isPaid, 
          statusi: isPaid ? 'e përfunduar' : 'borxh',
          debtType: isPaid ? 'none' : order.menyraPageses
        } : order
      ));
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Ka ndodhur një gabim gjatë përditësimit të statusit të pagesës: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Jeni të sigurtë që dëshironi të fshini këtë porosi?')) {
      return;
    }
    
    try {
      setError('');
      console.log(`Deleting order ${id}...`);
      await deleteOrder(id);
      console.log(`Order ${id} deleted successfully`);
      
      // Remove the order from the state
      setOrders(orders.filter(order => order.id !== id));
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(`Ka ndodhur një gabim gjatë fshirjes së porosisë: ${err.message || 'Gabim i panjohur'}`);
    }
  };
  
  const handleEdit = (id) => {
    navigate(`/orders/edit/${id}`);
  };
  
  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setShowPrintModal(true);
  };
  
  const handleAddSupplementaryOrder = (order) => {
    setSelectedParentOrder(order);
    setShowSupplementaryForm(true);
  };
  
  const handleSupplementaryOrderSuccess = () => {
    // Refresh orders to show updated data
    fetchOrders();
  };
  
  const filteredOrders = () => {
    let filtered = [...orders];
    
    // Apply status filter
    if (filter === 'inProcess') {
      filtered = filtered.filter(order => order.statusi === 'në proces');
    } else if (filter === 'completed') {
      filtered = filtered.filter(order => order.statusi === 'e përfunduar');
    } else if (filter === 'debt') {
      filtered = filtered.filter(order => order.statusi === 'borxh');
    } else if (filter === 'unpaid') {
      filtered = filtered.filter(order => !order.isPaymentDone);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.numriTelefonit.includes(searchTerm) ||
        order.vendi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.kaparaReceiver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.installer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'në proces':
        return <Badge bg="warning">Në Proces</Badge>;
      case 'e përfunduar':
        return <Badge bg="success">E Përfunduar</Badge>;
      case 'borxh':
        return <Badge bg="danger">Borxh</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  const getMeasurementStatusBadge = (status) => {
    switch (status) {
      case 'e pamatur':
        return <Badge bg="warning">E Pamatur</Badge>;
      case 'e matur':
        return <Badge bg="success">E Matur</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Duke ngarkuar porositë...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Lista e Porosive</h2>
        <Button variant="outline-primary" onClick={fetchOrders}>
          <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
        </Button>
      </div>
      
      {isManager && (
        <Alert variant="info" className="mb-4">
          <strong>Njoftim për Menaxherin:</strong> Ju mund të shikoni të gjitha porositë dhe të shtoni porosi të reja, por nuk mund të editoni, fshini, ose menaxhoni pagesat e porosive ekzistuese. Këto veprime janë të rezervuara vetëm për administratorin.
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2 d-flex gap-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => {
                setError('');
                fetchOrders();
              }}
            >
              Provo përsëri
            </Button>
            
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={async () => {
                try {
                  const success = await refreshAuth();
                  if (success) {
                    setError('');
                    fetchOrders();
                  }
                } catch (err) {
                  console.error('Error refreshing authentication:', err);
                }
              }}
            >
              Rifresko sesionin
            </Button>
          </div>
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={3}>
          <Button variant="primary" onClick={() => navigate('/orders/new')}>
            Porosi e Re
          </Button>
        </Col>
        <Col md={5}>
          <Form.Control
            type="text"
            placeholder="Kërko sipas emrit ose numrit të telefonit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Të Gjitha</option>
            <option value="inProcess">Në Proces</option>
            <option value="completed">Të Përfunduara</option>
            <option value="debt">Borxhe</option>
            <option value="unpaid">Të Papaguara</option>
          </Form.Select>
        </Col>
      </Row>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Klienti</th>
            <th>Kontakti</th>
            <th>Tipi</th>
            <th>Çmimi</th>
            <th>Statusi</th>
            <th>Matja</th>
            <th>Dita</th>
            <th>Personeli</th>
            <th>Veprime</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders().map(order => (
            <tr key={order.id}>
              <td>
                #{order.id}
              </td>
              <td>
                <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong>
              </td>
              <td>
                {order.numriTelefonit}<br/>
                <small className="text-muted">{order.vendi}</small>
              </td>
              <td>{order.tipiPorosise}</td>
              <td>
                {parseFloat(order.cmimiTotal).toFixed(2)} €<br/>
                <small>
                  {order.isPaymentDone ? 
                    <Badge bg="success">Paguar</Badge> : 
                    <Badge bg="danger">Papaguar: {(parseFloat(order.cmimiTotal) - parseFloat(order.kaparja)).toFixed(2)} €</Badge>
                  }
                </small>
              </td>
              <td>{order.statusi ? getStatusBadge(order.statusi) : null}</td>
              <td>{order.statusiMatjes ? getMeasurementStatusBadge(order.statusiMatjes) : null}</td>
              <td>{order.dita ? format(new Date(order.dita), 'dd/MM/yyyy') : null}</td>
              <td>
                <small>
                  <div><strong>Mori Kaparën:</strong> {order.kaparaReceiver}</div>
                  <div><strong>Dërguesi:</strong> {order.sender}</div>
                  <div><strong>Montuesi:</strong> {order.installer}</div>
                </small>
              </td>
              <td>
                <div className="d-flex gap-1 flex-wrap">
                  {canEditOrders && (
                    <Button variant="info" size="sm" onClick={() => handleEdit(order.id)}>
                      Edito
                    </Button>
                  )}
                  
                  {canEditOrders && (
                    <DimensionManager 
                      orderId={order.id}
                      initialDimensions={{
                        gjatesia: order.gjatesia,
                        gjeresia: order.gjeresia,
                        profiliLarte: order.profiliLarte,
                        profiliPoshtem: order.profiliPoshtem
                      }}
                      onUpdate={(updatedOrder) => {
                        // Përditëso porosinë në state
                        setOrders(orders.map(o => 
                          o.id === order.id ? { ...o, ...updatedOrder } : o
                        ));
                      }}
                    />
                  )}
                  
                  {order.tipiPorosise === 'derë garazhi' && (
                    <Button 
                      variant="outline-success" 
                      size="sm" 
                      onClick={() => handleAddSupplementaryOrder(order)}
                      title="Shto porosi shtesë"
                    >
                      <i className="bi bi-plus-circle"></i> Shtesë
                    </Button>
                  )}
                  
                  {!order.isPaymentDone && canManagePayments && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, true)}
                    >
                      Paguaj
                    </Button>
                  )}
                  
                  {order.isPaymentDone && canManagePayments && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      onClick={() => handlePaymentUpdate(order.id, false)}
                    >
                      Anulo Pagesën
                    </Button>
                  )}
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handlePrintInvoice(order)}
                    title={order.eshtePrintuar ? "Printo Përsëri" : "Printo Faturën"}
                  >
                    <i className="bi bi-printer"></i> {order.eshtePrintuar ? "Printo Përsëri" : "Printo Faturën"}
                  </Button>
                  
                  {canEditOrders && (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(order.id)}>
                      Fshi
                    </Button>
                  )}
                  
                  {isManager && !canEditOrders && (
                    <small className="text-muted align-self-center">
                      Vetëm shikimi
                    </small>
                  )}
                </div>
              </td>
            </tr>
          ))}
          
          {filteredOrders().length === 0 && (
            <tr>
              <td colSpan="10" className="text-center py-4">
                {searchTerm || filter !== 'all' ? 
                  'Nuk u gjetën porosi me kriteret e zgjedhura' : 
                  'Nuk ka porosi të regjistruara'
                }
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Print Invoice Modal */}
      <PrintInvoiceModal 
        show={showPrintModal} 
        onHide={() => {
          setShowPrintModal(false);
          // Refresh orders after printing to update the print status
          fetchOrders();
        }} 
        order={selectedOrder}
      />
      
      {/* Supplementary Order Form Modal */}
      <SupplementaryOrderForm
        show={showSupplementaryForm}
        onHide={() => {
          setShowSupplementaryForm(false);
          setSelectedParentOrder(null);
        }}
        parentOrder={selectedParentOrder}
        onSuccess={handleSupplementaryOrderSuccess}
      />
    </Container>
  );
};

export default OrderList; 