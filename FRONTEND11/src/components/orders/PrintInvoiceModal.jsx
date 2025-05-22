import React, { useRef, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import OrderInvoice from './OrderInvoice';
import { updateOrderPrintStatus } from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

const PrintInvoiceModal = ({ show, onHide, order }) => {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState('');
  const invoiceRef = useRef();
  const { user } = useAuth();
  
  const handlePrint = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setPrinting(true);
      setError('');
      
      // Create canvas from invoice component
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Calculate dimensions to fit on A4
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 20;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Save PDF
      pdf.save(`Invoice-${order?.id || 'Unknown'}.pdf`);
      
      // Update order print status in the database
      if (order?.id) {
        try {
          await updateOrderPrintStatus(order.id);
          // Close the modal after a short delay
          setTimeout(() => {
            setPrinting(false);
            onHide();
          }, 1000);
        } catch (err) {
          console.error('Error updating print status:', err);
          setError('Ndodhi një gabim gjatë përditësimit të statusit të printimit.');
          setPrinting(false);
        }
      } else {
        setPrinting(false);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Ndodhi një gabim gjatë gjenerimit të PDF.');
      setPrinting(false);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={printing ? null : onHide}
      size="lg"
      backdrop={printing ? 'static' : true}
      keyboard={!printing}
    >
      <Modal.Header closeButton={!printing}>
        <Modal.Title>Printo Faturën #{order?.id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger mb-3">
            {error}
          </div>
        )}
        
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <OrderInvoice ref={invoiceRef} order={order} user={user} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={printing}>
          Anulo
        </Button>
        <Button variant="primary" onClick={handlePrint} disabled={printing}>
          {printing ? (
            <>
              <Spinner 
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Duke printuar...
            </>
          ) : 'Printo Faturën'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrintInvoiceModal; 