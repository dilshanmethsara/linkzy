import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link as LinkIcon, Copy, Trash2, ExternalLink, QrCode, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Link } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CreateLinkForm } from '../components/CreateLinkForm';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });
  const [linkClicks, setLinkClicks] = useState<Record<string, number>>({});

  const fetchLinks = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setLinks(data);
      
      // Fetch actual click count from clicks table
      const linkIds = data.map(link => link.id);
      if (linkIds.length > 0) {
        const { data: clickData, error: clickError } = await supabase
          .from('clicks')
          .select('link_id')
          .in('link_id', linkIds);
        
        if (!clickError && clickData) {
          // Count clicks per link
          const clicksPerLink: Record<string, number> = {};
          clickData.forEach(click => {
            clicksPerLink[click.link_id] = (clicksPerLink[click.link_id] || 0) + 1;
          });
          
          const totalClicks = clickData.length;
          setStats({ totalLinks: data.length, totalClicks });
          setLinkClicks(clicksPerLink);
        } else {
          // Fallback to links table clicks if clicks table fails
          const totalClicks = data.reduce((sum, link) => sum + link.clicks, 0);
          setStats({ totalLinks: data.length, totalClicks });
          setLinkClicks({});
        }
      } else {
        setStats({ totalLinks: 0, totalClicks: 0 });
        setLinkClicks({});
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, [user?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    await supabase.from('links').delete().eq('id', id);
    fetchLinks();
  };

  const shortUrl = (code: string) => `${window.location.origin}/s/${code}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Manage your shortened links</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Links</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLinks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClicks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Referral Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{profile?.points || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Links</h2>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Create New Link
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : links.length === 0 ? (
        <Card>
          <div className="text-center py-8 sm:py-12">
            <LinkIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No links yet</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">Create your first shortened link to get started</p>
            <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Create Link
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {links.map((link) => (
            <Card key={link.id}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {link.title || link.short_code}
                    </h3>
                    {link.is_premium && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full self-start sm:self-auto">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-mono truncate">
                          {shortUrl(link.short_code)}
                        </code>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(shortUrl(link.short_code))}
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={shortUrl(link.short_code)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 truncate">{link.original_url}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {linkClicks[link.id] || link.clicks} clicks
                      </span>
                      <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {link.qr_code_url && (
                    <button
                      onClick={() => setSelectedLink(link)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <QrCode className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Link"
      >
        <CreateLinkForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLinks();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        title="QR Code"
      >
        {selectedLink?.qr_code_url && (
          <div className="text-center">
            <img
              src={selectedLink.qr_code_url}
              alt="QR Code"
              className="mx-auto mb-4 w-64 h-64"
            />
            <p className="text-gray-600 mb-4">Scan this QR code to visit the link</p>
            <Button onClick={() => {
              const a = document.createElement('a');
              a.href = selectedLink.qr_code_url!;
              a.download = `qr-${selectedLink.short_code}.png`;
              a.click();
            }}>
              Download QR Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
