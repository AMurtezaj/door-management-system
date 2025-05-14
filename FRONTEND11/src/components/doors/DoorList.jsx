import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Badge, Button, Spinner, 
  Form, InputGroup, Dropdown, DropdownButton 
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  Search, DoorOpen, DoorClosed, LockFill, 
  ExclamationTriangleFill, PlusCircle,
  ArrowUpCircleFill, ArrowDownCircleFill
} from 'react-bootstrap-icons';
import { getAllDoors, changeDoorStatus } from '../../services/doorService';
import { useSnackbar } from 'notistack';
import './DoorList.css';

const DoorList = () => {
  const [doors, setDoors] = useState([]);
  const [filteredDoors, setFilteredDoors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch doors on component mount
  useEffect(() => {
    fetchDoors();
  }, []);
  
  // Update filtered doors when search, sort, or filters change
  useEffect(() => {
    let result = [...doors];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(door => door.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(door => 
        door.name.toLowerCase().includes(term) || 
        door.location.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Handle string comparison
      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredDoors(result);
  }, [doors, searchTerm, sortField, sortDirection, statusFilter]);
  
  // Fetch all doors
  const fetchDoors = async () => {
    setLoading(true);
    try {
      const data = await getAllDoors();
      setDoors(data);
    } catch (error) {
      console.error('Error fetching doors:', error);
      enqueueSnackbar('Failed to fetch doors', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle door status change
  const handleStatusChange = async (doorId, newStatus) => {
    try {
      await changeDoorStatus(doorId, newStatus);
      
      // Update the doors array with the new status
      setDoors(prevDoors => 
        prevDoors.map(door => 
          door.id === doorId ? { ...door, status: newStatus } : door
        )
      );
      
      enqueueSnackbar(`Door ${newStatus} successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Error changing door status:', error);
      enqueueSnackbar(`Failed to ${newStatus} door`, { variant: 'error' });
    }
  };
  
  // Toggle sort direction when clicking the same field
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge bg="success">Open <DoorOpen className="ms-1" /></Badge>;
      case 'closed':
        return <Badge bg="info">Closed <DoorClosed className="ms-1" /></Badge>;
      case 'locked':
        return <Badge bg="primary">Locked <LockFill className="ms-1" /></Badge>;
      case 'alarm':
        return <Badge bg="danger">Alarm <ExclamationTriangleFill className="ms-1" /></Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpCircleFill className="ms-1" size={14} /> 
      : <ArrowDownCircleFill className="ms-1" size={14} />;
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <h5 className="mb-0">Door Management</h5>
          
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Link to="/doors/new">
              <Button variant="primary" size="sm">
                <PlusCircle className="me-1" /> Add Door
              </Button>
            </Link>
            
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={fetchDoors}
              disabled={loading}
            >
              {loading ? (
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  className="me-1" 
                />
              ) : 'Refresh'}
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="p-3 border-bottom d-flex flex-wrap gap-2">
          <div className="flex-grow-1 me-2">
            <InputGroup>
              <InputGroup.Text>
                <Search />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search doors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
          
          <DropdownButton
            title={`Status: ${statusFilter === 'all' ? 'All' : statusFilter}`}
            variant="outline-secondary"
            size="sm"
          >
            <Dropdown.Item 
              active={statusFilter === 'all'} 
              onClick={() => setStatusFilter('all')}
            >
              All
            </Dropdown.Item>
            <Dropdown.Item 
              active={statusFilter === 'open'} 
              onClick={() => setStatusFilter('open')}
            >
              Open
            </Dropdown.Item>
            <Dropdown.Item 
              active={statusFilter === 'closed'} 
              onClick={() => setStatusFilter('closed')}
            >
              Closed
            </Dropdown.Item>
            <Dropdown.Item 
              active={statusFilter === 'locked'} 
              onClick={() => setStatusFilter('locked')}
            >
              Locked
            </Dropdown.Item>
            <Dropdown.Item 
              active={statusFilter === 'alarm'} 
              onClick={() => setStatusFilter('alarm')}
            >
              Alarm
            </Dropdown.Item>
          </DropdownButton>
        </div>
        
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2 text-muted">Loading doors...</p>
          </div>
        ) : filteredDoors.length === 0 ? (
          <div className="text-center p-5">
            <p className="mb-0 text-muted">No doors found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 border-0">
              <thead className="table-light">
                <tr>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    Door Name {renderSortIcon('name')}
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('location')}
                  >
                    Location {renderSortIcon('location')}
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {renderSortIcon('status')}
                  </th>
                  <th 
                    className="sortable cursor-pointer"
                    onClick={() => handleSort('lastActivity')}
                  >
                    Last Activity {renderSortIcon('lastActivity')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoors.map(door => (
                  <tr key={door.id}>
                    <td>
                      <Link to={`/doors/${door.id}`} className="door-link">
                        {door.name}
                      </Link>
                    </td>
                    <td>{door.location}</td>
                    <td>{getStatusBadge(door.status)}</td>
                    <td>{new Date(door.lastActivity).toLocaleString()}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline-success"
                          onClick={() => handleStatusChange(door.id, 'open')}
                          disabled={door.status === 'open'}
                        >
                          <DoorOpen />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-info"
                          onClick={() => handleStatusChange(door.id, 'closed')}
                          disabled={door.status === 'closed'}
                        >
                          <DoorClosed />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleStatusChange(door.id, 'locked')}
                          disabled={door.status === 'locked'}
                        >
                          <LockFill />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DoorList; 