import { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, OperationType, handleFirestoreError } from './firebase';
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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setIsAuthChecking(true);
        // Set up real-time listener for user profile
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            let userData = snapshot.data() as UserProfile;
            
            // Ensure this specific email is always admin and joined group
            if (userData.email === 'keshavrajlkr7@gmail.com' && (userData.role !== 'admin' || !userData.joinedGroup)) {
              const updates: any = {};
              if (userData.role !== 'admin') updates.role = 'admin';
              if (!userData.joinedGroup) updates.joinedGroup = true;
              
              userData.role = 'admin';
              userData.joinedGroup = true;
              
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
              } catch (e) {
                console.error('Failed to update admin profile:', e);
              }
            }
            
            setUser(userData);
          } else {
            // Create new user profile if it doesn't exist
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              credits: 100, // Welcome credits increased to 100
              photoURL: firebaseUser.photoURL || undefined,
              role: firebaseUser.email === 'keshavrajlkr7@gmail.com' ? 'admin' : 'user',
              joinedGroup: firebaseUser.email === 'keshavrajlkr7@gmail.com' ? true : false,
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUser(newUser);
            } catch (e) {
              console.error('Failed to create user profile:', e);
              setUser(newUser);
            }
          }
          setIsAuthChecking(false);
        }, (error) => {
          console.error('Profile listener error:', error);
          setIsAuthChecking(false);
        });
      } else {
        setUser(null);
        setIsAuthChecking(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
    // Real-time listener handles updates, but we can add a small delay to ensure Firestore has propagated
    await new Promise(resolve => setTimeout(resolve, 500));
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
