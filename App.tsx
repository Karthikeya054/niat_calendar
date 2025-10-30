// App.tsx - FINAL FIXED VERSION
import React, { useState, useEffect } from 'react';
import { CalendarDashboard } from './components/CalendarDashboard';
import { LoginScreen } from './components/LoginScreen';
import { supabaseService } from './services/supabaseService';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      console.log('🔍 Starting auth check...');
      
      try {
        const isAuth = await supabaseService.isAuthenticated();
        
        if (!mounted) return;

        if (isAuth) {
          console.log('✅ User is authenticated, fetching profile...');
          try {
            const currentUser = await supabaseService.getMe();
            if (mounted) {
              console.log('✅ Profile loaded:', currentUser.email);
              setUser(currentUser);
            }
          } catch (profileError) {
            console.error('❌ Failed to load profile:', profileError);
            if (mounted) {
              // If profile fetch fails, log them out and show login
              await supabaseService.logout();
              setUser(null);
              setError('Failed to load user profile. Please sign in again.');
            }
          }
        } else {
          console.log('ℹ️ No active session');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        if (mounted) {
          setUser(null);
          setError('Authentication check failed. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Check auth immediately
    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(
      async (newUser) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', newUser?.email || 'logged out');
        setUser(newUser);
        setLoading(false);
        setError(null);
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    console.log('✅ Login successful:', loggedInUser.email);
    setUser(loggedInUser);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await supabaseService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-xl font-semibold text-gray-700">Loading...</div>
          <div className="mt-2 text-sm text-gray-500">Checking authentication...</div>
          {error && (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          )}
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-100">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {user ? (
        <CalendarDashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;