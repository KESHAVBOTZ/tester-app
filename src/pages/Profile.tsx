import { useAuth } from '../App';
import { signOut, auth, signInWithPopup, googleProvider } from '../firebase';
import { User, Briefcase, Settings, Share2, LogOut, LogIn, ChevronRight, Coins, CreditCard, Shield } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading && !user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <User size={48} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to AppTest Hub</h2>
        <p className="text-slate-500 text-center mb-8">Login to start testing apps and earn credits to publish your own.</p>
        <button
          onClick={handleLogin}
          className="w-full max-w-xs bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <LogIn size={20} />
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.name[0]}
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full border-2 border-white shadow-md">
            <Coins size={16} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
        <p className="text-slate-500 text-sm">{user.email}</p>
        <div className="mt-4 bg-orange-50 px-6 py-2 rounded-full flex items-center gap-2 border border-orange-100">
          <Coins size={20} className="text-orange-500" />
          <span className="font-bold text-slate-800">{user.credits} Credits</span>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Your Account</h3>
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            <button
              onClick={() => onNavigate('profile-edit')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <span className="font-semibold text-slate-700">Edit Profile</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <CreditCard size={20} />
                </div>
                <span className="font-semibold text-slate-700">Pricing</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">App Settings</h3>
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            <button
              onClick={() => onNavigate('my-apps')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Briefcase size={20} />
                </div>
                <span className="font-semibold text-slate-700">My Apps</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                  <Settings size={20} />
                </div>
                <span className="font-semibold text-slate-700">Settings</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <Shield size={20} />
                  </div>
                  <span className="font-semibold text-slate-700">Admin Panel</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            )}
            <button
              onClick={() => window.open('https://reddit.com', '_blank')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                  <Share2 size={20} />
                </div>
                <span className="font-semibold text-slate-700">Join Reddit Community</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-100 text-red-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </div>
  );
}
