// pages/api/printqr-pdf.js
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXFuenhwbG9wY2JjeHpvbmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDkxODQsImV4cCI6MjA1NTEyNTE4NH0.jCnn7TFfGV1EpBHhO1ITa8PMytD7UJfADpuzrzZOgpw',
      req,
      res,
    });
    
    const { propertyId } = req.query;

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('id, host_id, name, address, city')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (property.host_id !== session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate menu URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.guestify.shop';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#5e2bff',
        light: '#ffffff'
      }
    });

    // Configure headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=guestify-qrcode.pdf');

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0
    });

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Get the frame image path
    const frameImagePath = path.join(process.cwd(), 'public', 'images', 'qr-frame.png');
    
    // Check if frame image exists
    if (fs.existsSync(frameImagePath)) {
      // Add frame image as background
      doc.image(frameImagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height
      });
    } else {
      console.error(`Frame image not found at path: ${frameImagePath}`);
    }

    // Convert QR code data URL to Buffer
    const qrCodeImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Calculate center position for QR code (75mm width and height)
    const qrWidth = 75 / 25.4 * 72; // Convert mm to points (1 inch = 25.4mm, 1 inch = 72 points)
    const qrX = (doc.page.width - qrWidth) / 2;
    const qrY = (doc.page.height - qrWidth) / 2;

    // Add QR code in the center
    doc.image(qrCodeImage, qrX, qrY, {
      width: qrWidth,
      height: qrWidth
    });

    // Add property name at the top
    doc.fillColor('#5e2bff')
       .fontSize(12)
       .text(property.name, 0, 10, {
         align: 'center',
         width: doc.page.width
       });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}