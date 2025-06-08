import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Spinner, Alert, Modal, ButtonGroup } from 'react-bootstrap';
import { Search, Plus, Check, Clock, X, ExclamationTriangle } from 'react-bootstrap-icons';
import { getAllComplaints, getComplaintsByStatus, getComplaintStatistics, createComplaint, updateComplaintStatus, deleteComplaint } from '../services/complaintService';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'E mbetur', 'E kryer'
  const [statistics, setStatistics] = useState({ total: 0, pending: 0, resolved: 0 });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComplaintText, setNewComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { canEditOrders } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter complaints when search term or status filter changes
  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [complaintsData, statsData] = await Promise.all([
        getAllComplaints(),
        getComplaintStatistics()
      ]);
      
      setComplaints(complaintsData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error fetching complaints data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.statusi === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(complaint => 
        complaint.pershkrimi.toLowerCase().includes(searchLower)
      );
    }

    setFilteredComplaints(filtered);
  };

  const handleAddComplaint = async () => {
    if (!newComplaintText.trim()) {
      setError('Përshkrimi i ankesës është i detyrueshëm');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const newComplaint = await createComplaint(newComplaintText.trim());
      
      // Add to the beginning of the list
      setComplaints(prev => [newComplaint, ...prev]);
      setStatistics(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1
      }));
      
      setShowAddModal(false);
      setNewComplaintText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'E mbetur' ? 'E kryer' : 'E mbetur';
    
    try {
      setError('');
      await updateComplaintStatus(id, newStatus);
      
      // Update the complaint in the list
      setComplaints(prev => prev.map(complaint => 
        complaint.id === id ? { ...complaint, statusi: newStatus } : complaint
      ));
      
      // Update statistics
      setStatistics(prev => {
        if (newStatus === 'E kryer') {
          return { ...prev, pending: prev.pending - 1, resolved: prev.resolved + 1 };
        } else {
          return { ...prev, pending: prev.pending + 1, resolved: prev.resolved - 1 };
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      setSubmitting(true);
      setError('');
      
      await deleteComplaint(selectedComplaint.id);
      
      // Remove from the list
      setComplaints(prev => prev.filter(complaint => complaint.id !== selectedComplaint.id));
      
      // Update statistics
      setStatistics(prev => ({
        ...prev,
        total: prev.total - 1,
        [selectedComplaint.statusi === 'E kryer' ? 'resolved' : 'pending']: 
          prev[selectedComplaint.statusi === 'E kryer' ? 'resolved' : 'pending'] - 1
      }));
      
      setShowDeleteModal(false);
      setSelectedComplaint(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'E kryer') {
      return <Badge bg="success"><Check size={12} className="me-1" />E kryer</Badge>;
    } else {
      return <Badge bg="warning" text="dark"><Clock size={12} className="me-1" />E mbetur</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    return status === 'E kryer' ? <Check size={16} /> : <Clock size={16} />;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Duke ngarkuar ankesat...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3><ExclamationTriangle className="me-2" />Ankesat</h3>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise me-1"></i> Rifresko
          </Button>
          {canEditOrders && (
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus className="me-1" size={16} />
              Shto Ankesë të Re
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <h2 className="mb-0 text-primary">{statistics.total}</h2>
              <small className="text-muted">Totali i Ankesave</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <h2 className="mb-0 text-warning">{statistics.pending}</h2>
              <small className="text-muted">Ankesa në Pritje</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <h2 className="mb-0 text-success">{statistics.resolved}</h2>
              <small className="text-muted">Ankesa të Zgjidhura</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Kërko në përshkrimin e ankesës..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <ButtonGroup className="w-100">
                <Button 
                  variant={statusFilter === 'all' ? 'primary' : 'outline-primary'}
                  onClick={() => setStatusFilter('all')}
                >
                  Të Gjitha ({statistics.total})
                </Button>
                <Button 
                  variant={statusFilter === 'E mbetur' ? 'warning' : 'outline-warning'}
                  onClick={() => setStatusFilter('E mbetur')}
                >
                  Në Pritje ({statistics.pending})
                </Button>
                <Button 
                  variant={statusFilter === 'E kryer' ? 'success' : 'outline-success'}
                  onClick={() => setStatusFilter('E kryer')}
                >
                  Të Zgjidhura ({statistics.resolved})
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {filteredComplaints.length === 0 ? (
            <Alert variant="info" className="m-3">
              {complaints.length === 0 ? 
                'Nuk ka ankesa të regjistruara.' : 
                'Nuk u gjetën ankesa që përputhen me kriteret e kërkimit.'}
            </Alert>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50%' }}>Përshkrimi</th>
                  <th style={{ width: '15%' }}>Statusi</th>
                  <th style={{ width: '20%' }}>Data e Krijimit</th>
                  <th style={{ width: '15%' }}>Veprime</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td>
                      <div className="py-2">
                        {complaint.pershkrimi}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(complaint.statusi)}
                    </td>
                    <td>
                      <small className="text-muted">
                        {format(new Date(complaint.createdAt), 'dd/MM/yyyy HH:mm')}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1 align-items-center">
                        {canEditOrders ? (
                          <>
                            <Button
                              variant={complaint.statusi === 'E kryer' ? 'outline-warning' : 'outline-success'}
                              size="sm"
                              onClick={() => handleStatusChange(complaint.id, complaint.statusi)}
                              title={complaint.statusi === 'E kryer' ? 'Shëno si në pritje' : 'Shëno si të zgjidhur'}
                            >
                              {getStatusIcon(complaint.statusi === 'E kryer' ? 'E mbetur' : 'E kryer')}
                            </Button>
                            {complaint.statusi === 'E kryer' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowDeleteModal(true);
                                }}
                                title="Fshi ankesën"
                                className="p-1"
                                style={{ width: '30px', height: '30px' }}
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </>
                        ) : (
                          <small className="text-muted">Vetëm shikimi</small>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Complaint Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Shto Ankesë të Re</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Përshkrimi i Ankesës</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Shkruani përshkrimin e ankesës..."
                value={newComplaintText}
                onChange={(e) => setNewComplaintText(e.target.value)}
                maxLength={1000}
              />
              <Form.Text className="text-muted">
                {newComplaintText.length}/1000 karaktere
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Anulo
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddComplaint}
            disabled={submitting || !newComplaintText.trim()}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Duke ruajtur...
              </>
            ) : (
              'Ruaj Ankesën'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmo Fshirjen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>A jeni të sigurt që doni të fshini këtë ankesë?</p>
          {selectedComplaint && (
            <div className="bg-light p-3 rounded">
              <strong>Ankesa:</strong><br />
              {selectedComplaint.pershkrimi.length > 100 ? 
                `${selectedComplaint.pershkrimi.substring(0, 100)}...` : 
                selectedComplaint.pershkrimi}
            </div>
          )}
          <p className="text-danger mt-2 mb-0">
            <small>Ky veprim nuk mund të zhbëhet.</small>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Anulo
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteComplaint}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="me-1" />
                Duke fshirë...
              </>
            ) : (
              'Fshi Ankesën'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ComplaintsPage; 