import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Form, Button, Card, Row, Col, InputGroup, 
  Spinner, Alert
} from 'react-bootstrap';
import { ArrowLeft, Save, XCircle, DoorClosed } from 'react-bootstrap-icons';
import { getDoorById, createDoor, updateDoor } from '../../services/doorService';
import { useSnackbar } from 'notistack';

const DoorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'standard',
    accessLevel: 'restricted',
    description: '',
    status: 'closed'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch door data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchDoorData();
    }
  }, [id]);
  
  const fetchDoorData = async () => {
    setLoading(true);
    try {
      const data = await getDoorById(id);
      setFormData({
        name: data.name || '',
        location: data.location || '',
        type: data.type || 'standard',
        accessLevel: data.accessLevel || 'restricted',
        description: data.description || '',
        status: data.status || 'closed'
      });
    } catch (error) {
      console.error('Error fetching door:', error);
      enqueueSnackbar('Failed to fetch door data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Door name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Door type is required';
    }
    
    if (!formData.accessLevel) {
      newErrors.accessLevel = 'Access level is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isEditMode) {
        await updateDoor(id, formData);
        enqueueSnackbar('Door updated successfully', { variant: 'success' });
      } else {
        await createDoor(formData);
        enqueueSnackbar('Door created successfully', { variant: 'success' });
      }
      
      // Redirect back to doors list or door detail
      navigate(isEditMode ? `/doors/${id}` : '/doors');
    } catch (error) {
      console.error('Error saving door:', error);
      enqueueSnackbar(
        `Failed to ${isEditMode ? 'update' : 'create'} door`, 
        { variant: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading door data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 d-flex align-items-center">
        <Button 
          variant="outline-secondary" 
          className="me-2" 
          as={Link} 
          to={isEditMode ? `/doors/${id}` : '/doors'}
        >
          <ArrowLeft /> Back
        </Button>
        <h4 className="mb-0">{isEditMode ? 'Edit Door' : 'Add New Door'}</h4>
      </div>
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white py-3">
          <div className="d-flex align-items-center">
            <DoorClosed className="me-2" size={20} />
            <span>Door Information</span>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Door Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    placeholder="Enter door name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    isInvalid={!!errors.location}
                    placeholder="Enter door location"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.location}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Door Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    isInvalid={!!errors.type}
                  >
                    <option value="standard">Standard</option>
                    <option value="security">Security</option>
                    <option value="emergency">Emergency</option>
                    <option value="automatic">Automatic</option>
                    <option value="garage">Garage</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Access Level *</Form.Label>
                  <Form.Select
                    name="accessLevel"
                    value={formData.accessLevel}
                    onChange={handleChange}
                    isInvalid={!!errors.accessLevel}
                  >
                    <option value="public">Public</option>
                    <option value="restricted">Restricted</option>
                    <option value="private">Private</option>
                    <option value="emergency">Emergency Only</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.accessLevel}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter door description"
              />
            </Form.Group>
            
            {isEditMode && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="locked">Locked</option>
                </Form.Select>
              </Form.Group>
            )}
            
            <Alert variant="info" className="mb-4">
              <strong>Note:</strong> After creating the door, you will be able to manage access permissions.
            </Alert>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                as={Link} 
                to={isEditMode ? `/doors/${id}` : '/doors'}
                disabled={submitting}
              >
                <XCircle className="me-1" /> Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="me-1" /> {isEditMode ? 'Update Door' : 'Create Door'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default DoorForm; 