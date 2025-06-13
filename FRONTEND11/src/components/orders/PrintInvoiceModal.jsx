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
      
      // Create canvas from invoice component with better settings
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3, // Higher resolution for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        letterRendering: true,
        foreignObjectRendering: true
      });
      
      // PDF Configuration
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margins
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit page width (maintaining aspect ratio)
      const scale = contentWidth / (imgWidth * 0.264583); // Convert pixels to mm
      const scaledHeight = (imgHeight * 0.264583) * scale;
      
      // Check if content fits on one page
      if (scaledHeight <= contentHeight) {
        // Single page - center content
        const yOffset = margin + (contentHeight - scaledHeight) / 2;
        pdf.addImage(imgData, 'PNG', margin, yOffset, contentWidth, scaledHeight, '', 'FAST');
      } else {
        // Multi-page handling
        const pageHeight = contentHeight;
        const totalPages = Math.ceil(scaledHeight / pageHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate the source area for this page
          const sourceY = (i * pageHeight) / scale / 0.264583; // Convert back to pixels
          const sourceHeight = Math.min(pageHeight / scale / 0.264583, imgHeight - sourceY);
          
          // Create a canvas for this page section
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          const pageCanvasHeight = sourceHeight;
          
          pageCanvas.width = imgWidth;
          pageCanvas.height = pageCanvasHeight;
          
          // Draw the section of the original canvas
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              pageCtx.drawImage(img, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, pageCanvasHeight);
              resolve();
            };
            img.src = imgData;
          });
          
          // Add this page section to PDF
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const actualPageHeight = Math.min(pageHeight, scaledHeight - (i * pageHeight));
          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, actualPageHeight, '', 'FAST');
        }
      }
      
      // Add metadata to PDF
      pdf.setProperties({
        title: `LindiDoors Invoice #${order?.id}`,
        subject: `Invoice for ${order?.emriKlientit} ${order?.mbiemriKlientit}`,
        author: user?.emri && user?.mbiemri ? `${user.emri} ${user.mbiemri}` : 'LindiDoors System',
        creator: 'LindiDoors Management System',
        producer: 'LindiDoors Management System'
      });
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `LindiDoors_Invoice_${order?.id}_${timestamp}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
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
  
  const handleDirectPrint = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setPrinting(true);
      setError('');
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
      }
      
      // Get the invoice HTML
      const invoiceHTML = invoiceRef.current.outerHTML;
      
      // Create print-ready HTML document
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>LindiDoors Invoice #${order?.id}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            .invoice-container {
              max-width: none !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Print-specific styles */
            @media print {
              body {
                margin: 0;
                padding: 15mm;
              }
              
              .security-stamp {
                border: 2px solid #000 !important;
                background: white !important;
                page-break-inside: avoid;
              }
              
              .modern-alert, .alert {
                display: none !important;
              }
              
              /* Ensure QR code prints */
              canvas, img {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              /* Page break controls */
              .page-break {
                page-break-before: always;
              }
              
              .no-break {
                page-break-inside: avoid;
              }
              
              /* Table styling for print */
              table {
                border-collapse: collapse !important;
              }
              
              table, th, td {
                border: 1px solid #000 !important;
              }
              
              th, td {
                padding: 8px !important;
              }
              
              /* Dimension Visualization Print Styles */
              .dimension-visualization-card {
                border: 2px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .dimension-container {
                padding: 20px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                background-color: #f8f9fa;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              
              .dimension-header {
                text-align: center;
                margin-bottom: 15px;
              }
              
              .dimension-header h6 {
                color: #495057;
                font-weight: 600;
                margin-bottom: 0;
              }
              
              .dimension-visual {
                position: relative;
                width: 100%;
                height: 120px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              
              .arrow-line,
              .arrow-head-start,
              .arrow-head-end {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              
              /* Horizontal Arrows */
              .arrow-horizontal {
                position: relative;
                width: 80%;
                height: 20px;
                margin: 10px 0;
              }
              
              .arrow-horizontal .arrow-line {
                width: 100%;
                height: 2px;
                background-color: #007bff;
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
              }
              
              .arrow-horizontal .arrow-head-start,
              .arrow-horizontal .arrow-head-end {
                position: absolute;
                width: 0;
                height: 0;
                top: 50%;
                transform: translateY(-50%);
              }
              
              .arrow-horizontal .arrow-head-start {
                left: 0;
                border-top: 6px solid transparent;
                border-bottom: 6px solid transparent;
                border-right: 8px solid #007bff;
              }
              
              .arrow-horizontal .arrow-head-end {
                right: 0;
                border-top: 6px solid transparent;
                border-bottom: 6px solid transparent;
                border-left: 8px solid #007bff;
              }
              
              /* Vertical Arrows */
              .arrow-vertical {
                position: relative;
                height: 80%;
                width: 20px;
                margin: 0 10px;
                display: inline-block;
              }
              
              .arrow-vertical .arrow-line {
                height: 100%;
                width: 2px;
                background-color: #007bff;
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
              }
              
              .arrow-vertical .arrow-head-start,
              .arrow-vertical .arrow-head-end {
                position: absolute;
                width: 0;
                height: 0;
                left: 50%;
                transform: translateX(-50%);
              }
              
              .arrow-vertical .arrow-head-start {
                top: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-bottom: 8px solid #007bff;
              }
              
              .arrow-vertical .arrow-head-end {
                bottom: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid #007bff;
              }
              
              /* Profile Arrow Styles */
              .profile-line {
                background-color: #dc3545 !important;
              }
              
              .profile-head {
                border-color: #dc3545 !important;
              }
              
              .arrow-horizontal .profile-head {
                border-right-color: #dc3545 !important;
                border-left-color: #dc3545 !important;
              }
              
              .arrow-vertical .profile-head {
                border-top-color: #dc3545 !important;
                border-bottom-color: #dc3545 !important;
              }
              
              /* Final Arrow Styles */
              .final-line {
                background-color: #28a745 !important;
              }
              
              .final-head {
                border-color: #28a745 !important;
              }
              
              .arrow-horizontal .final-head {
                border-right-color: #28a745 !important;
                border-left-color: #28a745 !important;
              }
              
              .arrow-vertical .final-head {
                border-top-color: #28a745 !important;
                border-bottom-color: #28a745 !important;
              }
              
              /* Arrow Labels */
              .arrow-label {
                position: absolute;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                background-color: white;
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
              }
              
              .arrow-horizontal .arrow-label {
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
              }
              
              .arrow-vertical .arrow-label {
                left: 25px;
                top: 50%;
                transform: translateY(-50%);
              }
              
              .main-label {
                color: #007bff !important;
                border-color: #007bff !important;
              }
              
              .profile-label {
                color: #dc3545 !important;
                border-color: #dc3545 !important;
              }
              
              .final-label {
                color: #28a745 !important;
                border-color: #28a745 !important;
                font-weight: bold !important;
              }
              
              .calculation-text {
                background-color: white !important;
                border: 1px solid #dee2e6 !important;
                padding: 8px !important;
                margin-top: 15px !important;
                text-align: center !important;
                border-radius: 4px !important;
              }
              
              .dimension-summary {
                background-color: #f8f9fa !important;
                border: 1px solid #dee2e6 !important;
                padding: 15px !important;
                margin-top: 15px !important;
                border-radius: 6px !important;
              }
              
              .summary-item {
                padding: 5px 0 !important;
                font-size: 14px !important;
              }
              
              /* Bootstrap-like styles for print */
              .container-fluid { width: 100%; }
              .row { display: flex; flex-wrap: wrap; }
              .col-md-6 { flex: 0 0 50%; max-width: 50%; }
              .col-md-4 { flex: 0 0 33.333333%; max-width: 33.333333%; }
              .col-md-5 { flex: 0 0 41.666667%; max-width: 41.666667%; }
              .col-md-7 { flex: 0 0 58.333333%; max-width: 58.333333%; }
              .col-md-8 { flex: 0 0 66.666667%; max-width: 66.666667%; }
              .col-md-12 { flex: 0 0 100%; max-width: 100%; }
              .text-end { text-align: right; }
              .text-center { text-align: center; }
              .text-muted { color: #6c757d; }
              .text-primary { color: #0d6efd; }
              .text-success { color: #198754; }
              .text-info { color: #0dcaf0; }
              .mb-0 { margin-bottom: 0; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 1rem; }
              .mb-4 { margin-bottom: 1.5rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-4 { margin-top: 1.5rem; }
              .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
              .p-4 { padding: 1.5rem; }
              .small { font-size: 0.875em; }
              table { width: 100%; margin-bottom: 1rem; }
              .border-bottom { border-bottom: 1px solid #000; }
              .border-dark { border-color: #000; }
            }
          </style>
        </head>
        <body>
          ${invoiceHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      // Write content to print window
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Update print status after a delay
      setTimeout(async () => {
        if (order?.id) {
          try {
            await updateOrderPrintStatus(order.id);
          } catch (err) {
            console.error('Error updating print status:', err);
          }
        }
        setPrinting(false);
        onHide();
      }, 2000);
      
    } catch (err) {
      console.error('Error with direct print:', err);
      setError('Ndodhi një gabim gjatë printimit të drejtpërdrejtë: ' + err.message);
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
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={handlePrint} disabled={printing}>
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
                Duke gjeneruar PDF...
              </>
            ) : (
              <>
                📄 Gjenero PDF
              </>
            )}
          </Button>
          <Button variant="primary" onClick={handleDirectPrint} disabled={printing}>
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
            ) : (
              <>
                🖨️ Printo Drejtpërdrejt
              </>
            )}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PrintInvoiceModal; 