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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];

    // Initialize Supabase
    const supabase = createPagesServerClient({ req, res });
    
    // Verify user
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

    console.log('Fetching property:', propertyId);

    // Fetch property details with both host_id and user_id check
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', propertyId)
      .or(`host_id.eq.${user.id},user_id.eq.${user.id}`) // Check both fields
      .single();

    if (propertyError) {
      console.error('Property fetch error:', propertyError);
      // Log additional debug information
      console.log('Query details:', {
        propertyId,
        userId: user.id,
        errorCode: propertyError.code,
        errorMessage: propertyError.message
      });
      
      return res.status(404).json({ 
        error: 'Property not found',
        details: propertyError.message,
        debug: {
          propertyId,
          userId: user.id
        }
      });
    }

    if (!property) {
      console.error('Property not found for ID:', propertyId);
      return res.status(404).json({ 
        error: 'Property not found',
        details: 'No property found with the provided ID'
      });
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