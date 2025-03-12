import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated', hasSession: false });
    }

    return res.status(200).json({ 
      authenticated: true, 
      userId: session.user.id,
      email: session.user.email
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return res.status(500).json({ error: error.message });
  }
}