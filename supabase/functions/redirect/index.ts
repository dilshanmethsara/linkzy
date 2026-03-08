import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Link {
  id: string;
  original_url: string;
  is_active: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];

    if (!shortCode) {
      return new Response('Short code is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: link, error } = await supabase
      .from('links')
      .select('id, original_url, is_active')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (error || !link) {
      return new Response('Link not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (!link.is_active) {
      return new Response('Link is inactive', {
        status: 410,
        headers: corsHeaders,
      });
    }

    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || null;

    let device = 'desktop';
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
      device = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      device = 'tablet';
    }

    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const clientIP = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    const ipHash = clientIP !== 'unknown'
      ? await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(clientIP)
        ).then(hash =>
          Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        )
      : null;

    await supabase.from('clicks').insert({
      link_id: link.id,
      country: null,
      device,
      browser,
      referrer,
      ip_hash: ipHash,
    });

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.original_url,
      },
    });
  } catch (error) {
    console.error('Error processing redirect:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
