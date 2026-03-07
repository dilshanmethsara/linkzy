import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Link as LinkIcon, 
  Eye, 
  TrendingUp, 
  Ban, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Mail,
  Shield,
  Activity,
  Calendar,
  BarChart3,
  Clock,
  AlertTriangle,
  RefreshCw,
  UserX,
  UserCheck,
  MoreVertical,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { supabase, Profile, Link, Transaction } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface UserWithLinks extends Profile {
  links: Link[];
  totalClicks: number;
  lastActivity: string;
}

interface LinkWithUser extends Link {
  user_email: string;
  user_name: string;
}

export function Admin() {
  const [users, setUsers] = useState<UserWithLinks[]>([]);
  const [links, setLinks] = useState<LinkWithUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLinks: 0,
    totalClicks: 0,
    pendingWithdrawals: 0,
    activeUsers: 0,
    blockedUsers: 0,
    todaySignups: 0,
    todayClicks: 0,
    avgLinksPerUser: 0,
    topUser: { email: '', links: 0 }
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'links' | 'activities' | 'transactions'>('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithLinks | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch users with their links
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: linksData } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Process users with their links
      const usersWithLinks: UserWithLinks[] = (profiles || []).map(user => {
        const userLinks = (linksData || []).filter(link => link.user_id === user.id);
        const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
        const lastActivity = userLinks.length > 0 
          ? userLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : user.created_at;

        return {
          ...user,
          links: userLinks,
          totalClicks,
          lastActivity
        };
      });

      // Process links with user info
      const linksWithUsers: LinkWithUser[] = (linksData || []).map(link => {
        const user = profiles?.find(p => p.id === link.user_id);
        return {
          ...link,
          user_email: user?.email || 'Unknown',
          user_name: user?.full_name || 'Unknown'
        };
      });

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todaySignups = profiles?.filter(p => p.created_at.startsWith(today)).length || 0;
      const activeUsers = profiles?.filter(p => !p.is_blocked).length || 0;
      const blockedUsers = profiles?.filter(p => p.is_blocked).length || 0;
      const totalClicks = linksData?.reduce((sum, link) => sum + link.clicks, 0) || 0;
      const pendingWithdrawals = transactionsData?.filter(t => t.status === 'pending').length || 0;
      
      const avgLinksPerUser = profiles && profiles.length > 0 ? Math.round((linksData?.length || 0) / profiles.length * 10) / 10 : 0;
      
      const topUser = usersWithLinks.reduce((top, user) => 
        user.links.length > top.links.length ? user : top, 
        { email: '', links: 0 }
      );

      setUsers(usersWithLinks);
      setLinks(linksWithUsers);
      setTransactions(transactionsData || []);
      setStats({
        totalUsers: profiles?.length || 0,
        totalLinks: linksData?.length || 0,
        totalClicks,
        pendingWithdrawals,
        activeUsers,
        blockedUsers,
        todaySignups,
        todayClicks: linksData?.filter(l => l.created_at.startsWith(today)).reduce((sum, l) => sum + l.clicks, 0) || 0,
        avgLinksPerUser,
        topUser
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string, block: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({ is_blocked: block })
        .eq('id', userId);
      
      // Show success message
      alert(`User ${block ? 'blocked' : 'unblocked'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error blocking user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user and all their data? This action cannot be undone.')) return;
    
    try {
      // Delete user's links first
      await supabase.from('links').delete().eq('user_id', userId);
      // Delete user's transactions
      await supabase.from('transactions').delete().eq('user_id', userId);
      // Delete user profile
      await supabase.from('profiles').delete().eq('id', userId);
      
      alert('User deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await supabase.from('links').delete().eq('id', linkId);
      fetchData();
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Error deleting link');
    }
  };

  const updateTransaction = async (txId: string, status: string) => {
    try {
      await supabase
        .from('transactions')
        .update({ status, processed_at: new Date().toISOString() })
        .eq('id', txId);
      fetchData();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    }
  };

  const exportData = async (type: 'users' | 'links' | 'transactions') => {
    const data = type === 'users' ? users : type === 'links' ? links : transactions;
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(item => Object.values(item).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && !user.is_blocked) ||
                         (filterStatus === 'blocked' && user.is_blocked);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, links, and platform activities</p>
          </div>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['overview', 'users', 'links', 'activities', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-all rounded-md ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                  <p className="text-sm text-green-600 mt-1">+{stats.todaySignups} today</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Links</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLinks}</p>
                  <p className="text-sm text-gray-600 mt-1">{stats.avgLinksPerUser} avg/user</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Clicks</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1">+{stats.todayClicks} today</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingWithdrawals}</p>
                  <p className="text-sm text-gray-600 mt-1">withdrawals</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* User Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">User Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Blocked Users</span>
                  <span className="font-semibold text-red-600">{stats.blockedUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Top User</span>
                  <span className="font-semibold text-blue-600">{stats.topUser.email}</span>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => exportData('users')} variant="outline" className="flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Users
                </Button>
                <Button onClick={() => exportData('links')} variant="outline" className="flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Links
                </Button>
                <Button onClick={() => setActiveTab('users')} variant="outline" className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Manage Users
                </Button>
                <Button onClick={() => setActiveTab('transactions')} variant="outline" className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Transactions
                </Button>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Search and Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <Button onClick={() => exportData('users')} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </Card>

          {/* Users Table */}
          <Card hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Links</th>
                    <th className="text-left py-3 px-4">Clicks</th>
                    <th className="text-left py-3 px-4">Points</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Activity</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-sm text-gray-600">{user.full_name || 'No name'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                          <span>{user.links.length}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span>{user.totalClicks.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{user.points}</span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_blocked ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => blockUser(user.id, !user.is_blocked)}
                            className={`${user.is_blocked ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                            title={user.is_blocked ? 'Unblock User' : 'Block User'}
                          >
                            {user.is_blocked ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Links</h3>
              <Button onClick={() => exportData('links')} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Links
              </Button>
            </div>
          </Card>

          <Card hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Short Code</th>
                    <th className="text-left py-3 px-4">Original URL</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Clicks</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-blue-600" />
                          <span>/{link.short_code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="truncate max-w-md" title={link.original_url}>
                          {link.original_url}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-sm">{link.user_email}</div>
                          <div className="text-xs text-gray-600">{link.user_name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span>{link.clicks.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/${link.short_code}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Open Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Recent User Activities</h3>
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.email}</div>
                        <div className="text-xs text-gray-600">
                          {user.links.length} links • {user.totalClicks} clicks
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold mb-4">Platform Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Server Load</span>
                  <span className="text-sm text-green-600">Normal</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Database Size</span>
                  <span className="text-sm text-blue-600">{(links.length * 0.001).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Avg Response Time</span>
                  <span className="text-sm text-green-600">120ms</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Uptime Today</span>
                  <span className="text-sm text-green-600">99.9%</span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <Button onClick={() => exportData('transactions')} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </Card>

          <Card hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Notes</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 capitalize">{tx.type}</td>
                      <td className="py-3 px-4 font-medium">${tx.amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'approved' ? 'bg-green-100 text-green-700' :
                          tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{tx.notes || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {tx.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateTransaction(tx.id, 'approved')}
                              className="text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateTransaction(tx.id, 'rejected')}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">User Details</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h4 className="font-semibold mb-3">Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{selectedUser.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className="font-medium">
                      {selectedUser.is_blocked ? (
                        <span className="text-red-600">Blocked</span>
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Points:</span>
                    <p className="font-medium">{selectedUser.points}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Joined:</span>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* User Links */}
              <div>
                <h4 className="font-semibold mb-3">User Links ({selectedUser.links.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedUser.links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-mono text-sm">/{link.short_code}</div>
                        <div className="text-xs text-gray-600 truncate">{link.original_url}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{link.clicks} clicks</span>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    blockUser(selectedUser.id, !selectedUser.is_blocked);
                    setShowUserModal(false);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    selectedUser.is_blocked
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {selectedUser.is_blocked ? 'Unblock User' : 'Block User'}
                </button>
                <button
                  onClick={() => {
                    deleteUser(selectedUser.id);
                    setShowUserModal(false);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
