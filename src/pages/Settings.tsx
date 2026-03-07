import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Copy, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Settings() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile?.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
      refreshProfile();
    }

    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage('Error changing password');
    } else {
      setMessage('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  // Temporarily removed withdrawal functionality
  /* const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid amount');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: profile?.id,
      type: 'withdrawal',
      amount,
      status: 'pending',
    });

    if (error) {
      setMessage('Error creating withdrawal request');
    } else {
      setMessage('Withdrawal request submitted successfully');
      setWithdrawAmount('');
    }

    setLoading(false);
  }; */

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setMessage('Referral link copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg"
        >
          {message}
        </motion.div>
      )}

      <div className="space-y-6">
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" loading={loading}>
              Update Profile
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" loading={loading}>
              Change Password
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Referral Program</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-4">
                Share your referral link and earn 10 points for each user who signs up!
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/signup?ref=${profile?.referral_code}`}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
                <Button onClick={copyReferralLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Your referral code: <span className="font-bold">{profile?.referral_code}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Total points: <span className="font-bold">{profile?.points}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Temporarily removed withdrawal functionality
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Request Withdrawal</h2>
          </div>

          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <Button type="submit" loading={loading}>
              Request Withdrawal
            </Button>

            <p className="text-xs text-gray-500">
              Withdrawal requests are processed within 3-5 business days
            </p>
          </form>
        </Card>
        */}
      </div>
    </div>
  );
}
