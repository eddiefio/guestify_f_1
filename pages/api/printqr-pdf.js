// pages/api/printqr-pdf.js
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create Supabase client with the token
    const supabase = createServerSupabaseClient({ req, res });
    
    // Set the session manually
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { propertyId } = req.query;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Property error:', propertyError);
      return res.status(500).json({ error: `Database error: ${propertyError.message}` });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
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
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
}