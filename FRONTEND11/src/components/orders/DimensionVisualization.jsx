import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import './DimensionVisualization.css';

const DimensionVisualization = ({ dimensions }) => {
  const {
    gjatesia,
    gjeresia,
    profiliLarte,
    profiliPoshtem,
    gjatesiaFinale,
    gjeresiaFinale
  } = dimensions || {};

  // Nëse nuk ka të dhëna dimensionesh, mos shfaq asgjë
  if (!gjatesia && !gjeresia) {
    return null;
  }

  const renderDimensionArrow = (label, inputValue, profileValue, finalValue, isVertical = false) => {
    if (!inputValue) return null;

    return (
      <div className={`dimension-container ${isVertical ? 'vertical' : 'horizontal'}`}>
        <div className="dimension-header">
          <h6 className="mb-2">{label}</h6>
        </div>
        
        <div className="dimension-visual">
          {/* Shigjeta kryesore */}
          <div className={`main-arrow ${isVertical ? 'arrow-vertical' : 'arrow-horizontal'}`}>
            <div className="arrow-line"></div>
            <div className="arrow-head-start"></div>
            <div className="arrow-head-end"></div>
            <div className="arrow-label main-label">
              {inputValue} cm
            </div>
          </div>

          {/* Shigjeta e profilit nëse ka vlerë */}
          {profileValue > 0 && (
            <div className={`profile-arrow ${isVertical ? 'arrow-vertical' : 'arrow-horizontal'}`}>
              <div className="arrow-line profile-line"></div>
              <div className="arrow-head-start profile-head"></div>
              <div className="arrow-head-end profile-head"></div>
              <div className="arrow-label profile-label">
                -{profileValue} cm
              </div>
            </div>
          )}

          {/* Shigjeta e rezultatit final */}
          <div className={`final-arrow ${isVertical ? 'arrow-vertical' : 'arrow-horizontal'}`}>
            <div className="arrow-line final-line"></div>
            <div className="arrow-head-start final-head"></div>
            <div className="arrow-head-end final-head"></div>
            <div className="arrow-label final-label">
              = {finalValue?.toFixed(2)} cm
            </div>
          </div>
        </div>

        {/* Llogaritja tekstuale */}
        <div className="calculation-text">
          <small className="text-muted">
            {inputValue} - {profileValue || 0} = <strong>{finalValue?.toFixed(2)} cm</strong>
          </small>
        </div>
      </div>
    );
  };

  return (
    <Card className="dimension-visualization-card mb-4">
      <Card.Header>
        <h5 className="mb-0">📐 Dimensionet e Derës</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Gjatësia */}
          {gjatesia && (
            <Col md={6} className="mb-4">
              {renderDimensionArrow(
                "Gjatësia",
                parseFloat(gjatesia),
                parseFloat(profiliLarte || 0),
                gjatesiaFinale,
                true // vertical
              )}
            </Col>
          )}

          {/* Gjerësia */}
          {gjeresia && (
            <Col md={6} className="mb-4">
              {renderDimensionArrow(
                "Gjerësia",
                parseFloat(gjeresia),
                parseFloat(profiliPoshtem || 0),
                gjeresiaFinale,
                false // horizontal
              )}
            </Col>
          )}
        </Row>

        {/* Përmbledhje */}
        <div className="dimension-summary mt-3 p-3 bg-light rounded">
          <h6>📋 Përmbledhje:</h6>
          <Row>
            {gjatesia && (
              <Col md={6}>
                <div className="summary-item">
                  <strong>Gjatësia Finale:</strong> {gjatesiaFinale?.toFixed(2)} cm
                </div>
              </Col>
            )}
            {gjeresia && (
              <Col md={6}>
                <div className="summary-item">
                  <strong>Gjerësia Finale:</strong> {gjeresiaFinale?.toFixed(2)} cm
                </div>
              </Col>
            )}
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
};

export default DimensionVisualization; 