import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { propertyId } = req.query;

    console.log('PropertyId requested:', propertyId);

    // Verifica autenticazione
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Session:', session?.user?.id);
    console.log('Auth error:', authError);

    if (authError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', propertyId)
      .single();

    console.log('Property:', property);
    console.log('Property error:', propertyError);

    if (propertyError) {
      console.error('Property error:', propertyError);
      return res.status(500).json({ error: `Database error: ${propertyError.message}` });
    }

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Verifica che l'utente sia il proprietario
    console.log('Comparing host_id:', property.host_id, 'with user_id:', session.user.id);
    
    if (property.host_id !== session.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Genera l'URL del menu
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.guestify.shop';
    const menuUrl = `${baseUrl}/guest/menu/${propertyId}`;

    // Restituisci i dati necessari
    return res.status(200).json({ 
      property,
      menuUrl
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}