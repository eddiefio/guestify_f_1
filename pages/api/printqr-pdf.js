// pages/api/printqr-pdf.js
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// Initialize Supabase with the service role key for admin access
// This bypasses RLS for this specific API endpoint
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ndiqnzxplopcbcxzondp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyId, userId } = req.query;
    
    if (!propertyId) {
      return sendErrorPdf(res, 'Property ID is required');
    }

    // Fetch property details using the admin client (bypasses RLS)
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('apartments')
      .select('id, host_id, name, address, city')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Property error:', propertyError || 'Property not found');
      return sendErrorPdf(res, `Property not found: ${propertyError?.message || ''}`);
    }

    // Verify the user is the property owner if userId is provided
    if (userId && property.host_id !== userId) {
      console.log(`User ID mismatch: ${userId} vs ${property.host_id}`);
    }

    // Generate menu URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   req.headers.origin || 
                   'https://app.guestify.shop';
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

    // Add menu URL at the bottom
    doc.fillColor('#999999')
       .fontSize(8)
       .text(menuUrl, 0, doc.page.height - 30, {
         align: 'center',
         width: doc.page.width
       });

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    return sendErrorPdf(res, `Internal server error: ${error.message}`);
  }
}

// Helper function to send errors as PDF instead of JSON
function sendErrorPdf(res, errorMessage) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=guestify-error.pdf');
  
  const doc = new PDFDocument();
  doc.pipe(res);
  
  doc.fontSize(16).fillColor('red')
     .text('Error', { align: 'center' })
     .moveDown()
     .fontSize(12).fillColor('black')
     .text(errorMessage, { align: 'center' });
  
  doc.end();
}