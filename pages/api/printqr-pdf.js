import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { propertyId } = req.query;

    // Verifica autenticazione
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

    // Genera l'URL del menu
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.guestify.shop';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;

    // Genera il QR code come data URL
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#5e2bff',
        light: '#ffffff'
      }
    });

    // Configura gli headers per il download del PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=guestify-qrcode.pdf');

    // Crea un nuovo documento PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Pipe il PDF direttamente alla response
    doc.pipe(res);

    // Aggiungi contenuto al PDF
    doc.fontSize(24)
       .text('Guestify Menu', { align: 'center' });

    doc.fontSize(18)
       .text(property.name, { align: 'center' });

    // Converti il data URL in Buffer per l'immagine
    const qrCodeImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Aggiungi il QR code
    doc.image(qrCodeImage, {
      fit: [300, 300],
      align: 'center',
      valign: 'center'
    });

    doc.fontSize(12)
       .text('Scan this QR code to access the menu', { align: 'center' });

    doc.fontSize(10)
       .text(menuUrl, { align: 'center', color: 'blue' });

    // Finalizza il PDF
    doc.end();

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}