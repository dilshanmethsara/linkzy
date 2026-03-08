import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AD_COUNTDOWN_SECONDS = 15;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function Redirect() {
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ id: string; original_url: string } | null>(null);
  const [countdown, setCountdown] = useState(AD_COUNTDOWN_SECONDS);
  const [redirecting, setRedirecting] = useState(false);

  // Load Adsterra scripts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Set up atOptions configuration for High Performance Format
      (window as any).atOptions = {
        'key': 'cf3b25aa2bcd37649d9ffc74db6a919e',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };

      // Create and append the High Performance Format script
      const script1 = document.createElement('script');
      script1.src = 'https://www.highperformanceformat.com/cf3b25aa2bcd37649d9ffc74db6a919e/invoke.js';
      document.body.appendChild(script1);

      // Create and append the second ad script
      const script2 = document.createElement('script');
      script2.src = 'https://www.effectivegatecpm.com/q5hz55rxxm?key=167b269c4c525db6802028273f794e2d';
      document.body.appendChild(script2);

      // Create and append the third ad script with container
      const script3 = document.createElement('script');
      script3.async = true;
      script3.setAttribute('data-cfasync', 'false');
      script3.src = 'https://pl28864160.effectivegatecpm.com/6de4d82ad7e815a02e14f301d6c53094/invoke.js';
      
      // Append script to the ad container
      const container = document.getElementById('container-6de4d82ad7e815a02e14f301d6c53094');
      if (container) {
        container.appendChild(script3);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    
    // Handle both /s/abc123 and /abc123 patterns
    let shortCode = '';
    if (path.startsWith('/s/')) {
      shortCode = path.replace('/s/', '').split('/')[0];
    } else if (path.startsWith('/') && !path.startsWith('/admin') && !path.startsWith('/login') && !path.startsWith('/signup') && !path.startsWith('/reset-password')) {
      shortCode = path.replace('/', '').split('/')[0];
    }

    if (!shortCode) {
      setError('Invalid link');
      return;
    }

    async function fetchLink() {
      const { data, error: fetchError } = await supabase
        .from('links')
        .select('id, original_url, is_active')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Link not found');
        return;
      }

      if (!data.is_active) {
        setError('This link has been deactivated');
        return;
      }

      setLink({ id: data.id, original_url: data.original_url });
    }

    fetchLink();
  }, []);

  // Countdown when ad view is shown
  useEffect(() => {
    if (!link || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [link, countdown]);

  const handleContinue = async () => {
    if (!link || redirecting) return;
    setRedirecting(true);

    await supabase.from('clicks').insert({
      link_id: link.id,
      device: /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      referrer: document.referrer || null,
    });

    window.location.replace(link.original_url);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const domain = getDomain(link.original_url);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4 text-white text-center">
          <h1 className="text-lg sm:text-xl font-semibold">One moment...</h1>
          <p className="text-xs sm:text-sm opacity-90">You're going to</p>
          <p className="font-mono font-bold truncate text-sm sm:text-base" title={link.original_url}>{domain}</p>
        </div>

        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 min-h-[150px] sm:min-h-[200px] flex items-center justify-center">
          <div id="container-6de4d82ad7e815a02e14f301d6c53094" className="w-full h-full flex items-center justify-center" style={{ minHeight: '150px', maxHeight: '200px' }}>
            {/* Multiple ads will be loaded here */}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <button
            type="button"
            onClick={handleContinue}
            disabled={countdown > 0}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
          >
            {countdown > 0
              ? `Continue in ${countdown}s`
              : `Continue to ${domain}`}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Click the button above to go to your destination
          </p>
        </div>
      </div>
    </div>
  );
}
