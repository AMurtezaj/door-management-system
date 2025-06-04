import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import { List, Eye, PencilSquare, InfoCircle, CheckCircleFill } from 'react-bootstrap-icons';
import { getAllOrders, updateOrder } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

const UnmeasuredOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [unmeasuredOrders, setUnmeasuredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  
  const { isAuthenticated, canEditOrders } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterUnmeasuredOrders();
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

  const filterUnmeasuredOrders = () => {
    let filtered = orders.filter(order => order.statusiMatjes === 'e pamatur');
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.emriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.mbiemriKlientit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.numriTelefonit.includes(searchTerm) ||
        order.vendi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shitesi?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setUnmeasuredOrders(sorted);
  };

  const handleMarkAsMeasured = async (order) => {
    if (!window.confirm(`Jeni të sigurtë që dëshironi të shënoni matjen si të përfunduar për ${order.emriKlientit} ${order.mbiemriKlientit}?`)) {
      return;
    }
    
    try {
      setUpdatingOrder(order.id);
      setError('');
      
      const updatedOrderData = {
        ...order,
        statusiMatjes: 'e matur'
      };
      
      await updateOrder(order.id, updatedOrderData);
      
      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, statusiMatjes: 'e matur' } : o
      ));
      
      // Show success feedback
      alert(`Sukses! Matja për ${order.emriKlientit} ${order.mbiemriKlientit} u shënua si e përfunduar. Porosia tani do të shfaqet në listën kryesore.`);
      
    } catch (err) {
      setError(`Ka ndodhur një gabim gjatë përditësimit të statusit të matjes: ${err.message}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/orders/edit/${id}`);
  };

  const getMeasurementStatusBadge = (status) => {
    switch (status) {
      case 'e matur':
        return <Badge bg="success">E Matur</Badge>;
      case 'e pamatur':
        return <Badge bg="warning">E Pamatur</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Duke ngarkuar porositë e pamatura...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <List className="me-2" />
            Porositë e Pamatura
          </h2>
          <p className="text-muted">Menaxho porositë që kanë nevojë për matje</p>
        </div>
        <Button variant="outline-primary" onClick={fetchOrders}>
          <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
        </Button>
      </div>

      <Alert variant="info" className="mb-4">
        <div className="d-flex align-items-center">
          <InfoCircle className="me-2" size={16} />
          <div>
            <strong>Informacion:</strong> Këto porosi kanë status matjeje "E pamatur" dhe nuk shfaqen në listën kryesore të porosive.
            Pas përfundimit të matjes, shënojini si "E matur" që të shfaqen në listën kryesore.
          </div>
        </div>
      </Alert>

      {error && (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
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
          </div>
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Kërko sipas emrit, telefonit ose shitësit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={6} className="text-end">
          <Badge bg="warning" className="me-2">
            {unmeasuredOrders.length} porosi të pamatura
          </Badge>
        </Col>
      </Row>

      {unmeasuredOrders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <CheckCircleFill size={48} className="text-success mb-3" />
            <h5>Të gjitha porositë janë matur!</h5>
            <p className="text-muted">
              {searchTerm 
                ? 'Nuk u gjetën porosi të pamatura me kriteret e kërkimit.'
                : 'Aktualisht nuk ka porosi që kanë nevojë për matje.'
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setSearchTerm('')}
              >
                Pastro kërkimin
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Klienti</th>
              <th>Kontakti</th>
              <th>Tipi</th>
              <th>Shitësi</th>
              <th>Data e Krijimit</th>
              <th>Statusi i Matjes</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {unmeasuredOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <strong>{order.emriKlientit} {order.mbiemriKlientit}</strong>
                </td>
                <td>
                  {order.numriTelefonit}<br/>
                  <small className="text-muted">{order.vendi}</small>
                </td>
                <td>{order.tipiPorosise}</td>
                <td>{order.shitesi}</td>
                <td>
                  {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                </td>
                <td>{getMeasurementStatusBadge(order.statusiMatjes)}</td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => handleEdit(order.id)}
                      title="Shiko/Edito detajet"
                    >
                      <Eye size={14} />
                    </Button>
                    
                    {canEditOrders && (
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleMarkAsMeasured(order)}
                        disabled={updatingOrder === order.id}
                        title="Shëno si të matur"
                      >
                        {updatingOrder === order.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            <CheckCircleFill size={14} className="me-1" />
                            E Matur
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default UnmeasuredOrdersList; 