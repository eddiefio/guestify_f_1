// pages/api/printqr-pdf.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Estrai il token di autorizzazione
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];

    // Inizializza Supabase con il token
    const supabase = createPagesServerClient({ req, res });
    
    // Imposta la sessione manualmente
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({
        error: 'Authentication failed',
        details: authError?.message || 'Invalid token'
      });
    }

    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('id, host_id, name, address, city')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Property fetch error:', propertyError);
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Verify ownership
    if (property.host_id !== user.id) {
      return res.status(403).json({ error: 'Access denied - you do not own this property' });
    }

    // Set appropriate headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=guestify-menu-${property.name}.pdf`);

    // Create PDF document
    const doc = new PDFDocument();
    doc.pipe(res);

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_APP_URL}/guest/menu/${propertyId}`);

    // Add content to PDF
    doc.fontSize(25).text('Your Restaurant QR Code', { align: 'center' });
    doc.moveDown();
    doc.image(qrCodeData, {
      fit: [250, 250],
      align: 'center'
    });
    doc.moveDown();
    doc.fontSize(14).text(property.name, { align: 'center' });
    doc.fontSize(12).text(property.address, { align: 'center' });
    doc.fontSize(12).text(property.city, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
}