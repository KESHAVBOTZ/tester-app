import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, OperationType, handleFirestoreError } from './firebase';
import { UserProfile } from './types';
import { Home, User, PlusCircle, Settings, Layout as LayoutIcon, Briefcase, Shield } from 'lucide-react';
import HomePage from './pages/Home';
import ProfilePage from './pages/Profile';
import SubmitAppPage from './pages/SubmitApp';
import MyAppsPage from './pages/MyApps';
import AppDetailsPage from './pages/AppDetails';
import SettingsPage from './pages/Settings';
import PricingPage from './pages/Pricing';
import AdminPage from './pages/Admin';

// Auth Context
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshUser: async () => {} });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const fetchUserProfile = async (uid: string, firebaseUser: any) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        let userData = userDoc.data() as UserProfile;
        
        // Ensure this specific email is always admin
        if (userData.email === 'keshavrajlkr7@gmail.com' && userData.role !== 'admin') {
          userData.role = 'admin';
          try {
            await updateDoc(doc(db, 'users', uid), { role: 'admin' });
          } catch (e) {
            console.error('Failed to update admin role:', e);
          }
        }
        
        setUser(userData);
        // If admin, show dashboard on login if they are on home page
        if (userData.role === 'admin' && currentPage === 'home' && window.location.search === '') {
          setCurrentPage('admin');
        }
      } else {
        // Create new user profile if it doesn't exist
        const newUser: UserProfile = {
          uid,
          name: firebaseUser?.displayName || 'Anonymous',
          email: firebaseUser?.email || '',
          credits: 50, // Welcome credits
          photoURL: firebaseUser?.photoURL || undefined,
          role: firebaseUser?.email === 'keshavrajlkr7@gmail.com' ? 'admin' : 'user',
        };
        try {
          await setDoc(doc(db, 'users', uid), newUser);
          setUser(newUser);
        } catch (e) {
          console.error('Failed to create user profile:', e);
          // Still set user locally so they can use the app, even if profile creation failed in DB
          setUser(newUser);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic profile from firebaseUser so the app doesn't "bounce back" to logged out state
      const fallbackUser: UserProfile = {
        uid,
        name: firebaseUser?.displayName || 'User',
        email: firebaseUser?.email || '',
        credits: 50,
        photoURL: firebaseUser?.photoURL || undefined,
        role: firebaseUser?.email === 'keshavrajlkr7@gmail.com' ? 'admin' : 'user',
      };
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await fetchUserProfile(firebaseUser.uid, firebaseUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setIsAuthChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle deep linking only once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('app');
    if (appId) {
      setSelectedAppId(appId);
      setCurrentPage('details');
    }
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser.uid, auth.currentUser);
    }
  };

  const navigateTo = (page: string, appId?: string) => {
    setCurrentPage(page);
    if (appId) setSelectedAppId(appId);
  };

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      <div className="min-h-screen bg-slate-50 pb-20">
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
          {currentPage === 'home' && <HomePage onSelectApp={(id) => navigateTo('details', id)} />}
          {currentPage === 'profile' && <ProfilePage onNavigate={navigateTo} />}
          {currentPage === 'submit' && <SubmitAppPage onBack={() => navigateTo('home')} />}
          {currentPage === 'my-apps' && <MyAppsPage onBack={() => navigateTo('profile')} onSelectApp={(id) => navigateTo('details', id)} />}
          {currentPage === 'details' && selectedAppId && (
            <AppDetailsPage appId={selectedAppId} onBack={() => navigateTo('home')} />
          )}
          {currentPage === 'settings' && <SettingsPage onBack={() => navigateTo('profile')} />}
          {currentPage === 'pricing' && <PricingPage onBack={() => navigateTo('profile')} />}
          {currentPage === 'admin' && <AdminPage onBack={() => navigateTo('profile')} onSelectApp={(id) => navigateTo('details', id)} onNavigate={navigateTo} />}

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
            <button
              onClick={() => navigateTo('home')}
              className={`flex flex-col items-center gap-1 ${currentPage === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Home size={24} />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            
            {user?.role === 'admin' ? (
              <button
                onClick={() => navigateTo('admin')}
                className={`flex flex-col items-center gap-1 ${currentPage === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Shield size={24} />
                <span className="text-[10px] font-medium">Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigateTo('submit')}
                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
              >
                <PlusCircle size={32} />
              </button>
            )}

            <button
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center gap-1 ${currentPage === 'profile' || currentPage === 'my-apps' || currentPage === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <User size={24} />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </nav>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
