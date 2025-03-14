// pages/api/printqr-pdf.js
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
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
    // Create authenticated Supabase client
    const supabaseServerClient = createServerSupabaseClient({ req, res });
    
    // Check if we have a session
    const {
      data: { session },
    } = await supabaseServerClient.auth.getSession();

    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated',
      });
    }

    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch property details using the authenticated client
    const { data: property, error: propertyError } = await supabaseServerClient
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

    // Generate the URL of the menu
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin || 'https://app.guestify.shop';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;

    // Generate the QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#5e2bff',
        light: '#ffffff'
      }
    });

    // Configure the headers for the PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=guestify-qrcode.pdf');

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Handle potential errors in the PDF generation stream
    doc.on('error', (err) => {
      console.error('PDFKit error:', err);
      // At this point headers are already sent, so we can only log the error
    });

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(24)
       .text('Guestify Menu', { align: 'center' });
       
    doc.moveDown(0.5);

    doc.fontSize(18)
       .text(property.name, { align: 'center' });
       
    doc.moveDown(1);

    if (property.address) {
      doc.fontSize(12)
         .text(property.address, { align: 'center' });
         
      doc.moveDown(0.5);
    }

    // Convert the data URL to Buffer for the image
    const qrCodeImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Add the QR code
    doc.image(qrCodeImage, {
      fit: [300, 300],
      align: 'center',
      valign: 'center'
    });

    doc.moveDown(1);

    doc.fontSize(12)
       .text('Scan this QR code to access the menu', { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(10)
       .text(menuUrl, { align: 'center', color: 'blue', underline: true });
       
    doc.moveDown(2);
    
    // Add a footer with date
    const now = new Date();
    doc.fontSize(8)
       .text(`Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, { 
         align: 'center',
         color: 'gray'
       });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Check if headers have been sent already
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error while generating PDF',
        details: error.message 
      });
    }
    // If headers are already sent, we can't send a JSON response
  }
}