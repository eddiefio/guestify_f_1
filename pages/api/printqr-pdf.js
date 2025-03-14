// pages/api/printqr-pdf.js
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create authenticated Supabase client using the new API
    const supabase = createPagesServerClient({ req, res });
    
    // Check if we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log('No session found');
      return res.status(401).json({
        error: 'Not authenticated',
        details: 'No valid session found'
      });
    }

    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch property details using the authenticated client
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

    if (property.host_id !== session.user.id) {
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