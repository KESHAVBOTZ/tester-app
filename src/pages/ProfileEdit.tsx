import React, { useState } from 'react';
import { useAuth } from '../App';
import { db, doc, updateDoc } from '../firebase';
import { ArrowLeft, User, Camera, Save, Loader2 } from 'lucide-react';

interface ProfileEditPageProps {
  onBack: () => void;
}

export default function ProfileEditPage({ onBack }: ProfileEditPageProps) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        photoURL
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-6 flex items-center gap-4 border-b border-slate-50 sticky top-0 bg-white z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Edit Profile</h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100 flex items-center justify-center">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg">
                <Camera size={18} />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium">Update your profile information</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Profile Photo URL</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Camera size={20} />
                </div>
                <input
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 ml-1">Paste a direct link to an image (JPG, PNG)</p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
              Profile updated successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
