// pages/api/printqr-pdf.js
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  try {
    // Fetch property details
    const { data: property, error } = await supabase
      .from('apartments')
      .select('name')
      .eq('id', propertyId)
      .single();
      
    if (error) throw error;
    
    // Generate menu URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#5e2bff',
        light: '#ffffff'
      }
    });
    
    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // Set PDF metadata
    doc.info.Title = `Guestify Menu - ${property.name}`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=guestify-qrcode-${propertyId}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#5e2bff').text('Guestify Menu', { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(18).fillColor('#000000').text(property.name, { align: 'center' });
    doc.moveDown(2);
    
    // Add QR code image
    const qrSize = 300;
    doc.image(qrCodeDataURL, doc.page.width/2 - qrSize/2, doc.y, {
      width: qrSize
    });
    
    doc.moveDown(2);
    doc.fontSize(12).fillColor('#666666').text('Scan this QR code to access the menu', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#999999').text(menuUrl, { align: 'center' });
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}