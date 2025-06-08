import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import { List, Eye, PencilSquare, InfoCircle, CheckCircleFill, PlusSquare } from 'react-bootstrap-icons';
import { getAllOrders } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

const IncompleteOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [incompleteOrders, setIncompleteOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { isAuthenticated, canEditOrders } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterIncompleteOrders();
  }, [orders, searchTerm]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError('Ka ndodhur një gabim gjatë marrjes së porosive');
      setLoading(false);
    }
  };

  const filterIncompleteOrders = () => {
    let filtered = orders.filter(order => {
      // Filter for incomplete orders using the isIncomplete flag
      // As a fallback, also check for measurement data with missing financial info
      const isMarkedIncomplete = order.isIncomplete === true;
      const hasBasicMeasurementData = order.matesi && order.statusiMatjes === 'e matur';
      const missingFinancialData = !order.cmimiTotal || parseFloat(order.cmimiTotal) === 0;
      
      return isMarkedIncomplete || (hasBasicMeasurementData && missingFinancialData);
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const customerName = `${order.emriKlientit} ${order.mbiemriKlientit}`.toLowerCase();
        const phone = order.numriTelefonit?.toLowerCase() || '';
        const location = order.vendi?.toLowerCase() || '';
        
        return customerName.includes(searchTerm.toLowerCase()) ||
               phone.includes(searchTerm.toLowerCase()) ||
               location.includes(searchTerm.toLowerCase());
      });
    }

    setIncompleteOrders(filtered);
  };

  const handleCompleteOrder = (orderId) => {
    navigate(`/orders/complete/${orderId}`);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/edit/${orderId}`);
  };

  const getOrderStatusBadge = (order) => {
    return (
      <Badge bg="warning" className="me-2">
        📏 Matje e Kompletuar
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Duke ngarkuar...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <div className="d-flex align-items-center">
                <List className="me-2" size={24} />
                <div>
                  <h4 className="mb-0">Porositë e Pakompletara</h4>
                  <small>Porositë në pritje për kompletim me të dhëna financiare, matje dhe dimensione</small>
                </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <InfoCircle className="me-2" size={16} />
          {error}
        </Alert>
      )}

      <Alert variant="info" className="mb-4">
        <div className="d-flex align-items-center">
          <InfoCircle className="me-2" size={16} />
          <div>
            <strong>Informacion:</strong> Këto janë porositë që janë krijuar me procesin "Filloj me Matje". 
            Gjatë kompletimit mund të përditësoni: informacionet e matjes (status, matës, datë), 
            të dhënat financiare (çmimi, kaparja, pagesa), informacionet e personelit (dërguesi, montuesi), 
            dimensionet e derës dhe detajet e tjera të porosisë.
            <div className="mt-2">
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => navigate('/orders/measurement')}
              >
                <PlusSquare className="me-1" size={14} />
                Shto Matje të Re
              </Button>
            </div>
          </div>
        </div>
      </Alert>
      
      <Row className="mb-3">
        <Col md={6}>
          <h5 className="text-muted">
            {incompleteOrders.length} porosi të pakompletara
          </h5>
        </Col>
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Kërko sipas emrit, telefonit ose vendndodhjes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>
      
      {incompleteOrders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <CheckCircleFill size={48} className="text-success mb-3" />
            <h5 className="text-muted">Asnjë porosi e pakompletuar</h5>
            <p className="text-muted mb-3">
              {searchTerm 
                ? `Nuk u gjetën porosi të pakompletara që përputhen me "${searchTerm}"`
                : "Të gjitha porositë janë të kompletara ose nuk ka porosi me proces 'Filloj me Matje'"
              }
            </p>
            <Button 
              variant="primary"
              onClick={() => navigate('/orders/measurement')}
            >
              <PlusSquare className="me-2" size={16} />
              Filloj me Matje të Re
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Klienti</th>
                <th>Telefoni</th>
                <th>Vendi</th>
                <th>Matësi</th>
                <th>Data Matjes</th>
                <th>Tipi</th>
                <th>Statusi</th>
                <th>Veprime</th>
              </tr>
            </thead>
            <tbody>
              {incompleteOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id}</strong>
                  </td>
                  <td>
                    <div>
                      <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="text-muted">{order.numriTelefonit}</span>
                  </td>
                  <td>
                    <span className="text-muted">{order.vendi}</span>
                  </td>
                  <td>
                    <Badge bg="info" className="me-1">
                      {order.matesi || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    {order.dataMatjes ? (
                      <span className="text-muted">
                        {format(new Date(order.dataMatjes), 'dd/MM/yyyy')}
                      </span>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    <Badge 
                      bg={order.tipiPorosise === 'derë garazhi' ? 'primary' : 'secondary'}
                      className="me-1"
                    >
                      {order.tipiPorosise === 'derë garazhi' ? '🏠 Derë Garazhi' : '🔧 Kapgjik'}
                    </Badge>
                  </td>
                  <td>
                    {getOrderStatusBadge(order)}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleCompleteOrder(order.id)}
                        className="d-flex align-items-center"
                        title="Kompletoj Porosinë"
                      >
                        <CheckCircleFill className="me-1" size={14} />
                        Kompletoj
                      </Button>
                      
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        title="Shiko Detajet"
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
};

export default IncompleteOrdersList; 