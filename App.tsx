// App.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { CalendarDashboard } from './components/CalendarDashboard';
import { LoginScreen } from './components/LoginScreen';
import { supabaseService, supabase } from './services/supabaseService';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.error('Auth check timed out');
      setLoading(false);
    }, 5000);

    const checkUser = async () => {
      try {
        // Check if we have an active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check:', session ? 'Found' : 'None', error);
        
        if (error) {
          console.error('Session error:', error);
          setUser(null);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        if (session?.user) {
          try {
            const currentUser = await supabaseService.getMe();
            console.log('User profile loaded:', currentUser);
            setUser(currentUser);
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            // User exists but no profile yet - treat as logged out
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const currentUser = await supabaseService.getMe();
            setUser(currentUser);
          } catch (error) {
            console.error('Error loading user profile:', error);
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await supabaseService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-xl font-semibold text-gray-700">Loading...</div>
          <div className="mt-2 text-sm text-gray-500">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? (
        <CalendarDashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;