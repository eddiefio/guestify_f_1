export default async function handler(req, res) {
    try {
      const cookies = req.headers.cookie || '';
      const tokenMatch = cookies.match(/supabase-access-token=([^;]+)/);
      const userMatch = cookies.match(/supabase-user=([^;]+)/);
      
      const token = tokenMatch ? tokenMatch[1] : null;
      const userJson = userMatch ? userMatch[1] : null;
      
      let user = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch (e) {
          console.error('Error parsing user JSON from cookie', e);
        }
      }
      
      return res.status(200).json({
        hasToken: !!token,
        hasUserCookie: !!userJson,
        user: user,
        cookies: req.headers.cookie ? 'Present' : 'None',
        authenticated: !!(token && user)
      });
    } catch (error) {
      console.error('Auth test error:', error);
      return res.status(500).json({ error: error.message });
    }
  }