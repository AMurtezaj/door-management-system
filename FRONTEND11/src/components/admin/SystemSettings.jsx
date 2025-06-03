import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Badge,
  Accordion,
  Spinner,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  Gear,
  Bell,
  Clock,
  Calendar3,
  Shield,
  Database,
  Cpu,
  CloudCheck,
  InfoCircle,
  CheckCircle,
  ExclamationTriangle
} from 'react-bootstrap-icons';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      overdueOrderReminders: true,
      reminderFrequency: 60, // minutes
      enableWebsocketNotifications: true,
      enableEmailNotifications: false,
      enableSmsNotifications: false,
      notificationPriority: 'medium'
    },
    orderManagement: {
      autoMarkOverdueAfterDays: 1,
      enableAutoRescheduling: false,
      autoRescheduleToNextAvailable: false,
      maxRescheduleAttempts: 3,
      sendCustomerNotifications: true
    },
    capacity: {
      enableCapacityWarnings: true,
      warningThreshold: 80, // percentage
      enableOverbooking: false,
      overbookingLimit: 10, // percentage
      enableWaitingList: false
    },
    system: {
      enableBackgroundTasks: true,
      enableDataBackup: true,
      backupFrequency: 'daily',
      enableSystemLogs: true,
      logRetentionDays: 30,
      enablePerformanceMonitoring: true
    },
    security: {
      enableTwoFactorAuth: false,
      sessionTimeout: 120, // minutes
      enablePasswordExpiry: false,
      passwordExpiryDays: 90,
      enableLoginAttemptLimiting: true,
      maxLoginAttempts: 5
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In real implementation, this would fetch from API
      // const response = await api.get('/admin/settings');
      // setSettings(response.data);
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Gabim gjatë ngarkimit të cilësimeve');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // In real implementation, this would save to API
      // const response = await api.put('/admin/settings', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Cilësimet u ruajtën me sukses!');
      showToastNotification('Cilësimet u ruajtën me sukses!', 'success');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Gabim gjatë ruajtjes së cilësimeve');
      showToastNotification('Gabim gjatë ruajtjes së cilësimeve', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Jeni të sigurt që doni të riktheni cilësimet e parazgjedhura?')) {
      setSettings({
        notifications: {
          overdueOrderReminders: true,
          reminderFrequency: 60,
          enableWebsocketNotifications: true,
          enableEmailNotifications: false,
          enableSmsNotifications: false,
          notificationPriority: 'medium'
        },
        orderManagement: {
          autoMarkOverdueAfterDays: 1,
          enableAutoRescheduling: false,
          autoRescheduleToNextAvailable: false,
          maxRescheduleAttempts: 3,
          sendCustomerNotifications: true
        },
        capacity: {
          enableCapacityWarnings: true,
          warningThreshold: 80,
          enableOverbooking: false,
          overbookingLimit: 10,
          enableWaitingList: false
        },
        system: {
          enableBackgroundTasks: true,
          enableDataBackup: true,
          backupFrequency: 'daily',
          enableSystemLogs: true,
          logRetentionDays: 30,
          enablePerformanceMonitoring: true
        },
        security: {
          enableTwoFactorAuth: false,
          sessionTimeout: 120,
          enablePasswordExpiry: false,
          passwordExpiryDays: 90,
          enableLoginAttemptLimiting: true,
          maxLoginAttempts: 5
        }
      });
      showToastNotification('Cilësimet u rikthyen në vlerat e parazgjedhura', 'info');
    }
  };

  const showToastNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Duke ngarkuar cilësimet...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-2 d-flex align-items-center">
                  <Gear className="me-3 text-primary" size={32} />
                  Cilësimet e Sistemit
                </h2>
                <p className="text-muted mb-0">
                  Menaxhoni cilësimet e njoftimeve, porosive dhe sigurisë së sistemit
                </p>
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  className="me-2"
                  onClick={resetToDefaults}
                  disabled={saving}
                >
                  Rikthe në Default
                </Button>
                <Button
                  variant="primary"
                  onClick={saveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Duke ruajtur...
                    </>
                  ) : (
                    'Ruaj Ndryshimet'
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                <ExclamationTriangle className="me-2" />
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="mb-4">
                <CheckCircle className="me-2" />
                {success}
              </Alert>
            )}

            <Accordion defaultActiveKey="0">
              {/* Notification Settings */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <Bell className="me-2 text-warning" />
                  Cilësimet e Njoftimeve
                  <Badge bg="primary" className="ms-2">
                    {Object.values(settings.notifications).filter(Boolean).length} aktive
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Njoftimet për Porosi të Vonuara</h6>
                          <Form.Check
                            type="switch"
                            id="overdueReminders"
                            label="Aktivizo njoftimet për porosi të vonuara"
                            checked={settings.notifications.overdueOrderReminders}
                            onChange={(e) => updateSetting('notifications', 'overdueOrderReminders', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Frekuenca e njoftimeve (minuta)</Form.Label>
                            <Form.Control
                              type="number"
                              min="15"
                              max="1440"
                              value={settings.notifications.reminderFrequency}
                              onChange={(e) => updateSetting('notifications', 'reminderFrequency', parseInt(e.target.value))}
                            />
                            <Form.Text className="text-muted">
                              Sa shpesh të dërgohen njoftimet (15 minuta - 24 orë)
                            </Form.Text>
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>Prioriteti i njoftimeve</Form.Label>
                            <Form.Select
                              value={settings.notifications.notificationPriority}
                              onChange={(e) => updateSetting('notifications', 'notificationPriority', e.target.value)}
                            >
                              <option value="low">I ulët</option>
                              <option value="medium">Mesatar</option>
                              <option value="high">I lartë</option>
                            </Form.Select>
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Kanalit e Njoftimeve</h6>
                          <Form.Check
                            type="switch"
                            id="websocketNotifications"
                            label="Njoftimet në kohë reale (WebSocket)"
                            checked={settings.notifications.enableWebsocketNotifications}
                            onChange={(e) => updateSetting('notifications', 'enableWebsocketNotifications', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="switch"
                            id="emailNotifications"
                            label="Njoftimet me email"
                            checked={settings.notifications.enableEmailNotifications}
                            onChange={(e) => updateSetting('notifications', 'enableEmailNotifications', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="switch"
                            id="smsNotifications"
                            label="Njoftimet me SMS"
                            checked={settings.notifications.enableSmsNotifications}
                            onChange={(e) => updateSetting('notifications', 'enableSmsNotifications', e.target.checked)}
                          />
                          <Alert variant="info" className="mt-3 mb-0">
                            <InfoCircle className="me-2" />
                            <small>
                              Email dhe SMS njoftimet kërkojnë konfigurimin e shërbimeve të jashtme
                            </small>
                          </Alert>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Order Management Settings */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <Calendar3 className="me-2 text-success" />
                  Menaxhimi i Porosive
                  <Badge bg="success" className="ms-2">
                    {Object.values(settings.orderManagement).filter(Boolean).length} aktive
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Automatizimi i Porosive</h6>
                          <Form.Group className="mb-3">
                            <Form.Label>Shëno si të vonuar pas (ditë)</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              max="30"
                              value={settings.orderManagement.autoMarkOverdueAfterDays}
                              onChange={(e) => updateSetting('orderManagement', 'autoMarkOverdueAfterDays', parseInt(e.target.value))}
                            />
                          </Form.Group>
                          <Form.Check
                            type="switch"
                            id="autoRescheduling"
                            label="Riplanifikim automatik"
                            checked={settings.orderManagement.enableAutoRescheduling}
                            onChange={(e) => updateSetting('orderManagement', 'enableAutoRescheduling', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="switch"
                            id="autoRescheduleNext"
                            label="Riplanifiko në datën e parë të disponueshme"
                            checked={settings.orderManagement.autoRescheduleToNextAvailable}
                            onChange={(e) => updateSetting('orderManagement', 'autoRescheduleToNextAvailable', e.target.checked)}
                            className="mb-3"
                            disabled={!settings.orderManagement.enableAutoRescheduling}
                          />
                          <Form.Group>
                            <Form.Label>Tentatime maksimale riplanifikimi</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              max="10"
                              value={settings.orderManagement.maxRescheduleAttempts}
                              onChange={(e) => updateSetting('orderManagement', 'maxRescheduleAttempts', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Komunikimi me Klientët</h6>
                          <Form.Check
                            type="switch"
                            id="customerNotifications"
                            label="Dërgo njoftimet te klientët"
                            checked={settings.orderManagement.sendCustomerNotifications}
                            onChange={(e) => updateSetting('orderManagement', 'sendCustomerNotifications', e.target.checked)}
                            className="mb-3"
                          />
                          <Alert variant="warning" className="mb-0">
                            <ExclamationTriangle className="me-2" />
                            <small>
                              Njoftimet për klientët dërgohen automatikisht për ndryshimet e porosive
                            </small>
                          </Alert>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Capacity Management Settings */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <Clock className="me-2 text-info" />
                  Menaxhimi i Kapacitetit
                  <Badge bg="info" className="ms-2">
                    {Object.values(settings.capacity).filter(Boolean).length} aktive
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Paralajmërimet e Kapacitetit</h6>
                          <Form.Check
                            type="switch"
                            id="capacityWarnings"
                            label="Aktivizo paralajmërimet e kapacitetit"
                            checked={settings.capacity.enableCapacityWarnings}
                            onChange={(e) => updateSetting('capacity', 'enableCapacityWarnings', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Pragu i paralajmërimit (%)</Form.Label>
                            <Form.Control
                              type="number"
                              min="50"
                              max="100"
                              value={settings.capacity.warningThreshold}
                              onChange={(e) => updateSetting('capacity', 'warningThreshold', parseInt(e.target.value))}
                            />
                            <Form.Text className="text-muted">
                              Paralajmëro kur kapaciteti kalon këtë përqindje
                            </Form.Text>
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Overbooking & Lista e Pritjes</h6>
                          <Form.Check
                            type="switch"
                            id="enableOverbooking"
                            label="Lejo overbooking"
                            checked={settings.capacity.enableOverbooking}
                            onChange={(e) => updateSetting('capacity', 'enableOverbooking', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Limiti i overbooking (%)</Form.Label>
                            <Form.Control
                              type="number"
                              min="5"
                              max="50"
                              value={settings.capacity.overbookingLimit}
                              onChange={(e) => updateSetting('capacity', 'overbookingLimit', parseInt(e.target.value))}
                              disabled={!settings.capacity.enableOverbooking}
                            />
                          </Form.Group>
                          <Form.Check
                            type="switch"
                            id="enableWaitingList"
                            label="Aktivizo listën e pritjes"
                            checked={settings.capacity.enableWaitingList}
                            onChange={(e) => updateSetting('capacity', 'enableWaitingList', e.target.checked)}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* System Settings */}
              <Accordion.Item eventKey="3">
                <Accordion.Header>
                  <Database className="me-2 text-dark" />
                  Cilësimet e Sistemit
                  <Badge bg="dark" className="ms-2">
                    {Object.values(settings.system).filter(Boolean).length} aktive
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Performanca & Backup</h6>
                          <Form.Check
                            type="switch"
                            id="backgroundTasks"
                            label="Aktivizo detyrat në sfond"
                            checked={settings.system.enableBackgroundTasks}
                            onChange={(e) => updateSetting('system', 'enableBackgroundTasks', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="switch"
                            id="dataBackup"
                            label="Backup automatik i të dhënave"
                            checked={settings.system.enableDataBackup}
                            onChange={(e) => updateSetting('system', 'enableDataBackup', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Frekuenca e backup</Form.Label>
                            <Form.Select
                              value={settings.system.backupFrequency}
                              onChange={(e) => updateSetting('system', 'backupFrequency', e.target.value)}
                              disabled={!settings.system.enableDataBackup}
                            >
                              <option value="hourly">Çdo orë</option>
                              <option value="daily">Ditore</option>
                              <option value="weekly">Javore</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Check
                            type="switch"
                            id="performanceMonitoring"
                            label="Monitorimi i performancës"
                            checked={settings.system.enablePerformanceMonitoring}
                            onChange={(e) => updateSetting('system', 'enablePerformanceMonitoring', e.target.checked)}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Logimi i Sistemit</h6>
                          <Form.Check
                            type="switch"
                            id="systemLogs"
                            label="Aktivizo logjimin e sistemit"
                            checked={settings.system.enableSystemLogs}
                            onChange={(e) => updateSetting('system', 'enableSystemLogs', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group>
                            <Form.Label>Ruajtja e log-eve (ditë)</Form.Label>
                            <Form.Control
                              type="number"
                              min="7"
                              max="365"
                              value={settings.system.logRetentionDays}
                              onChange={(e) => updateSetting('system', 'logRetentionDays', parseInt(e.target.value))}
                              disabled={!settings.system.enableSystemLogs}
                            />
                            <Form.Text className="text-muted">
                              Sa ditë të ruhen log-et e sistemit
                            </Form.Text>
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Security Settings */}
              <Accordion.Item eventKey="4">
                <Accordion.Header>
                  <Shield className="me-2 text-danger" />
                  Cilësimet e Sigurisë
                  <Badge bg="danger" className="ms-2">
                    {Object.values(settings.security).filter(Boolean).length} aktive
                  </Badge>
                </Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Autentifikimi</h6>
                          <Form.Check
                            type="switch"
                            id="twoFactorAuth"
                            label="Autentifikim me dy faktorë"
                            checked={settings.security.enableTwoFactorAuth}
                            onChange={(e) => updateSetting('security', 'enableTwoFactorAuth', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group className="mb-3">
                            <Form.Label>Timeout i sesionit (minuta)</Form.Label>
                            <Form.Control
                              type="number"
                              min="30"
                              max="480"
                              value={settings.security.sessionTimeout}
                              onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                            />
                          </Form.Group>
                          <Form.Check
                            type="switch"
                            id="loginAttempts"
                            label="Limitimi i tentativave të hyrjes"
                            checked={settings.security.enableLoginAttemptLimiting}
                            onChange={(e) => updateSetting('security', 'enableLoginAttemptLimiting', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group>
                            <Form.Label>Tentatime maksimale hyrjeje</Form.Label>
                            <Form.Control
                              type="number"
                              min="3"
                              max="10"
                              value={settings.security.maxLoginAttempts}
                              onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                              disabled={!settings.security.enableLoginAttemptLimiting}
                            />
                          </Form.Group>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <h6 className="mb-3">Politikat e Fjalëkalimeve</h6>
                          <Form.Check
                            type="switch"
                            id="passwordExpiry"
                            label="Skadimi i fjalëkalimeve"
                            checked={settings.security.enablePasswordExpiry}
                            onChange={(e) => updateSetting('security', 'enablePasswordExpiry', e.target.checked)}
                            className="mb-3"
                          />
                          <Form.Group>
                            <Form.Label>Skadimi pas (ditë)</Form.Label>
                            <Form.Control
                              type="number"
                              min="30"
                              max="365"
                              value={settings.security.passwordExpiryDays}
                              onChange={(e) => updateSetting('security', 'passwordExpiryDays', parseInt(e.target.value))}
                              disabled={!settings.security.enablePasswordExpiry}
                            />
                          </Form.Group>
                          <Alert variant="danger" className="mt-3 mb-0">
                            <Shield className="me-2" />
                            <small>
                              Ndryshimet e sigurisë do të aplikohen pas rilogjimit
                            </small>
                          </Alert>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>
        </Row>
      </Container>

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
    </>
  );
};

export default SystemSettings; 