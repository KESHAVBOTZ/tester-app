import React, { useState } from 'react';
import { useAuth } from '../App';
import { db, doc, setDoc, collection, serverTimestamp, updateDoc, increment, OperationType, handleFirestoreError } from '../firebase';
import { ArrowLeft, Upload, Info, Coins, PlusCircle, Users, AlertCircle } from 'lucide-react';
import WelcomeModal from '../components/WelcomeModal';

interface SubmitAppPageProps {
  onBack: () => void;
}

export default function SubmitAppPage({ onBack }: SubmitAppPageProps) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [developerName, setDeveloperName] = useState(user?.name || '');
  const [playStoreLink, setPlayStoreLink] = useState('');
  const [testersRequired, setTestersRequired] = useState(10);
  const [iconUrl, setIconUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const creditsNeeded = user?.role === 'admin' ? 0 : 60; // No cost for admins

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.joinedGroup) {
      setShowWelcome(true);
      return;
    }

    if (user.role !== 'admin' && user.credits < creditsNeeded) {
      setError(`You need at least ${creditsNeeded} credits to publish an app.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create the app document with a manual ID to satisfy security rules
      const appRef = doc(collection(db, 'apps'));
      const appId = appRef.id;

      await setDoc(appRef, {
        id: appId,
        name,
        developerId: user.uid,
        developerName,
        playStoreLink,
        testersRequired,
        testersJoined: 0,
        credits: 20, // Credits awarded to testers
        iconUrl: iconUrl || `https://picsum.photos/seed/${name}/200/200`,
        description,
        createdAt: serverTimestamp(),
        testingTime: 14,
        developerLastActiveAt: serverTimestamp(),
      });

      // 2. Deduct credits from user
      if (creditsNeeded > 0) {
        await updateDoc(doc(db, 'users', user.uid), {
          credits: increment(-creditsNeeded)
        });
      }

      await refreshUser();
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'apps');
      setError('Failed to publish app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
        <p className="text-slate-500 text-center mb-8">You must be logged in to publish an app.</p>
        <button
          onClick={onBack}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showWelcome && user && <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />}
      
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Publish App</h1>
      </div>

      <div className="bg-indigo-50 p-4 rounded-2xl mb-8 flex items-start gap-3 border border-indigo-100">
        <Info size={20} className="text-indigo-600 mt-0.5" />
        <div>
          <p className="text-sm text-indigo-900 font-medium">
            {user.role === 'admin' ? (
              <span>Admin Mode: <span className="font-bold text-emerald-600">Free Publishing</span></span>
            ) : (
              <span>You need at least <span className="font-bold">{creditsNeeded} credits</span> to publish apps.</span>
            )}
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            Available Credits: <span className="font-bold text-emerald-600">{user.credits}</span>
          </p>
        </div>
      </div>

      {!user.joinedGroup && (
        <div className="bg-orange-50 p-4 rounded-2xl mb-8 flex items-start gap-3 border border-orange-100">
          <AlertCircle size={20} className="text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm text-orange-900 font-bold">Google Group Required</p>
            <p className="text-xs text-orange-700 mt-1 mb-2">
              You must join our Google Group before you can publish an app.
            </p>
            <button 
              type="button"
              onClick={() => setShowWelcome(true)}
              className="text-xs font-bold text-indigo-600 flex items-center gap-1"
            >
              Join Group Now <Users size={12} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-12">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">App name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Woof Translator"
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Developer Name</label>
          <input
            type="text"
            required
            value={developerName}
            onChange={(e) => setDeveloperName(e.target.value)}
            placeholder="Your name or studio name"
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">App's Android Link</label>
          <input
            type="url"
            required
            value={playStoreLink}
            onChange={(e) => setPlayStoreLink(e.target.value)}
            placeholder="https://play.google.com/store/apps/details?id=..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Testers needed</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={testersRequired}
              onChange={(e) => setTestersRequired(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Credits per test</label>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-slate-500 flex items-center gap-2">
              <Coins size={16} />
              <span>20 Credits</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">App Icon URL (Optional)</label>
          <div className="flex gap-4 items-center">
            <input
              type="url"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="flex-1 bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
              {iconUrl ? (
                <img src={iconUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Upload size={20} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your app and what testers should look for..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px]"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || user.credits < creditsNeeded}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            loading || user.credits < creditsNeeded
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
          ) : (
            <>
              <PlusCircle size={20} />
              Create Listing
            </>
          )}
        </button>
      </form>
    </div>
  );
}
