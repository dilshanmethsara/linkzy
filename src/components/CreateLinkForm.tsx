import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import QRCode from 'qrcode';

interface CreateLinkFormProps {
  onSuccess: () => void;
}

export function CreateLinkForm({ onSuccess }: CreateLinkFormProps) {
  const { user } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRandomCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const finalShortCode = shortCode || generateRandomCode();

      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('short_code', finalShortCode)
        .maybeSingle();

      if (existing) {
        setError('This short code is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      const shortUrl = `${window.location.origin}/s/${finalShortCode}`;
      const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const { error: insertError } = await supabase
        .from('links')
        .insert({
          user_id: user?.id,
          short_code: finalShortCode,
          original_url: originalUrl,
          title: title || null,
          qr_code_url: qrCodeDataUrl,
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create link');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination URL *
        </label>
        <input
          type="url"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/very-long-url"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Short Code (Optional)
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">{window.location.origin}/s/</span>
          <input
            type="text"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="my-link"
            pattern="[a-zA-Z0-9-_]+"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to generate a random code
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My awesome link"
        />
      </div>

      <div className="flex space-x-4">
        <Button type="submit" className="flex-1" loading={loading}>
          Create Link
        </Button>
      </div>
    </form>
  );
}
