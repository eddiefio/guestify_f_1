// pages/api/printqr-pdf.js
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propertyId } = req.query;
  
  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient({ req, res });

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ error: 'Unauthorized - Session error' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - No session' });
    }

    console.log('User ID:', session.user.id);
    console.log('Property ID:', propertyId);

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', session.user.id)
      .single();

    console.log('Property data:', property);
    console.log('Property error:', propertyError);
      
    if (propertyError) {
      console.error('Supabase error:', propertyError);
      return res.status(500).json({ error: `Failed to fetch property details: ${propertyError.message}` });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    // Generate menu URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;
    
    // Generate QR code
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

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=guestify-qrcode-${propertyId}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add content to PDF
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#5e2bff')
       .text('Guestify Menu', { align: 'center' });

    doc.moveDown();

    // Add property details
    doc.font('Helvetica')
       .fontSize(18)
       .fillColor('#000000')
       .text(property.name, { align: 'center' });

    doc.moveDown(2);

    // Add QR code
    const qrSize = 300;
    doc.image(qrCodeDataURL, 
              doc.page.width/2 - qrSize/2, 
              doc.y, 
              { width: qrSize });

    doc.moveDown(2);

    // Add instructions
    doc.fontSize(12)
       .fillColor('#666666')
       .text('Scan this QR code to access the menu', { align: 'center' });

    doc.moveDown();

    // Add URL
    doc.fontSize(10)
       .fillColor('#999999')
       .text(menuUrl, { align: 'center', link: menuUrl });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error in PDF generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to generate PDF: ${error.message}` });
    }
  }
}