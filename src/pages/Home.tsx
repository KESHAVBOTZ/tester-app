import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, signInWithPopup, googleProvider, auth, OperationType, handleFirestoreError } from '../firebase';
import { AppModel } from '../types';
import { Search, ChevronRight, Coins, LogIn, Lock, Users } from 'lucide-react';
import { useAuth } from '../App';
import TestingDashboard from '../components/TestingDashboard';
import WelcomeModal from '../components/WelcomeModal';

interface HomePageProps {
  onSelectApp: (id: string) => void;
}

export default function HomePage({ onSelectApp }: HomePageProps) {
  const { user, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<AppModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && !user.joinedGroup) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'apps'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppModel));
      setApps(appsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'apps');
    });
    return () => unsubscribe();
  }, []);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.developerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isInactive = (app: AppModel) => {
    if (!app.developerLastActiveAt) return false;
    return (Date.now() - app.developerLastActiveAt.toDate().getTime()) > 14 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="p-6">
      {showWelcome && user && <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Test Apps</h1>
          <p className="text-slate-500 text-sm">Test these apps to get credits</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {authLoading && !user ? (
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <div className="bg-orange-50 px-4 py-2 rounded-full flex items-center gap-2 border border-orange-100">
              <Coins size={20} className="text-orange-500" />
              <span className="font-bold text-slate-800">{user.credits}</span>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md shadow-indigo-100 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogIn size={18} />
              )}
              <span className="text-sm font-semibold">{isLoggingIn ? 'Logging in...' : 'Login'}</span>
            </button>
          )}
          {loginError && (
            <p className="text-[10px] text-red-500 font-medium max-w-[150px] text-right">{loginError}</p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search for apps"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Testing Dashboard */}
      {user && user.joinedGroup && <TestingDashboard user={user} />}

      {/* Featured Apps */}
      <div className="mb-8 overflow-hidden">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Featured Apps</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {filteredApps.slice(0, 3).map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              className={`flex-shrink-0 w-48 rounded-3xl p-5 text-left text-white shadow-xl active:scale-95 transition-transform relative overflow-hidden ${
                isInactive(app) ? 'bg-slate-400 shadow-slate-100 grayscale' : 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-100'
              }`}
            >
              {isInactive(app) && (
                <div className="absolute top-2 right-2 bg-white/20 p-1 rounded-full">
                  <Lock size={12} />
                </div>
              )}
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mb-4 flex items-center justify-center text-xl font-bold border border-white/20">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className={`w-full h-full object-cover rounded-2xl ${isInactive(app) ? 'grayscale' : ''}`} referrerPolicy="no-referrer" />
                ) : (
                  app.name[0]
                )}
              </div>
              <h3 className="font-bold text-sm truncate mb-1">{app.name}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-100">
                  <Coins size={12} />
                  {app.credits}
                </div>
                <div className="text-[10px] text-indigo-200">
                  {app.testersJoined}/{app.testersRequired}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* App List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] text-left group ${
                isInactive(app) ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:border-indigo-100'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50 relative">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className={`w-full h-full object-cover ${isInactive(app) ? 'grayscale' : ''}`} referrerPolicy="no-referrer" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-bold text-xl ${isInactive(app) ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {app.name[0]}
                  </div>
                )}
                {isInactive(app) && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Lock size={20} className="text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{app.name}</h3>
                <p className="text-slate-500 text-xs truncate">{app.developerName}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-indigo-600 font-bold">
                  <span className="text-sm">{app.credits} Credits</span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="text-[10px] text-slate-400">
                  {app.testersJoined}/{app.testersRequired} Testers
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">No apps found</p>
          </div>
        )}
      </div>
    </div>
  );
}
