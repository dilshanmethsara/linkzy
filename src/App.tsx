import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { hasSupabaseConfig } from './lib/supabase';
import { Redirect } from './pages/Redirect';
import { Homepage } from './pages/Homepage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { Navbar } from './components/Navbar';

function SetupScreen() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">LinkZy Setup Required</h1>
        <p className="text-gray-600 mb-6">
          Please configure your Supabase connection to use LinkZy.
        </p>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Environment Variables Needed</h3>
            <div className="font-mono text-sm space-y-1">
              <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=your-anon-key-here</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Setup Steps</h3>
            <ol className="text-sm space-y-2 text-gray-700">
              <li>1. Create a .env file in the project root</li>
              <li>2. Copy your Supabase URL and anon key</li>
              <li>3. Add them to the .env file</li>
              <li>4. Restart your development server</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<'home' | 'auth'>('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'signup') {
      setAuthPage('signup');
      setCurrentView('auth');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (currentView === 'home') {
      return <Homepage onNavigate={(page) => {
        if (page === 'login' || page === 'signup') {
          setAuthPage(page);
          setCurrentView('auth');
        }
      }} />;
    }
    if (authPage === 'signup') {
      return <Signup onNavigate={() => setCurrentView('home')} />;
    }
    return <Login onNavigate={() => setCurrentView('home')} />;
  }

  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Blocked</h2>
          <p className="text-gray-600 mb-6">Your account has been blocked. Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  // Handle authenticated user navigation
  if (currentPage === 'homepage') {
    return <Homepage onNavigate={(page) => {
      if (page === 'login' || page === 'signup') {
        // User wants to logout and go to auth pages
        setCurrentPage('dashboard'); // Reset to dashboard first
        // The actual logout will be handled by the user clicking logout
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />

      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'settings' && <Settings />}
      {currentPage === 'admin' && profile?.is_admin && <Admin />}
    </div>
  );
}

function App() {
  if (!hasSupabaseConfig) {
    return <SetupScreen />;
  }
  
  const path = window.location.pathname;
  
  // Handle short links: /s/abc123 or /abc123 (but not other routes)
  const isShortLink = (
    (path.startsWith('/s/') && path.split('/').length === 3) ||
    (path.startsWith('/') && 
     path.split('/').length === 2 && 
     !['admin', 'login', 'signup', 'reset-password', 'analytics', 'settings', 'dashboard'].includes(path.replace('/', '')) &&
     path !== '/')
  );
  
  if (isShortLink) {
    return (
      <AuthProvider>
        <Redirect />
      </AuthProvider>
    );
  }
  
  // Handle password reset: /reset-password
  if (path === '/reset-password') {
    return (
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    );
  }
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
