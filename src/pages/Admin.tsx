import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, collection, query, onSnapshot, doc, deleteDoc, updateDoc, increment, OperationType, handleFirestoreError, getDocs, writeBatch } from '../firebase';
import { AppModel, UserProfile } from '../types';
import { ArrowLeft, Trash2, Shield, AlertTriangle, Users, Briefcase, Send, Edit2, Check, X, Plus, Minus, Coins, CheckCircle2 } from 'lucide-react';

interface AdminPageProps {
  onBack: () => void;
  onSelectApp: (id: string) => void;
  onNavigate: (page: string) => void;
}

type AdminTab = 'apps' | 'users' | 'tools';

export default function AdminPage({ onBack, onSelectApp, onNavigate }: AdminPageProps) {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppModel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('apps');
  
  // Edit States
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editAppData, setEditAppData] = useState<Partial<AppModel>>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserCredits, setEditUserCredits] = useState<number>(0);
  
  // Mass Send State
  const [massCredits, setMassCredits] = useState<number>(0);
  const [isSendingMass, setIsSendingMass] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Listen to Apps
    const appsQuery = query(collection(db, 'apps'));
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppModel));
      setApps(appsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'apps');
    });

    // Listen to Users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(usersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => {
      unsubscribeApps();
      unsubscribeUsers();
    };
  }, [user]);

  const handleDeleteApp = async (appId: string) => {
    if (!window.confirm('Are you sure you want to delete this app?')) return;
    try {
      await deleteDoc(doc(db, 'apps', appId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `apps/${appId}`);
    }
  };

  const handleUpdateApp = async (appId: string) => {
    try {
      await updateDoc(doc(db, 'apps', appId), editAppData);
      setEditingApp(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `apps/${appId}`);
    }
  };

  const handleUpdateUserCredits = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { credits: editUserCredits });
      setEditingUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleMassSendCredits = async () => {
    if (massCredits <= 0) return;
    if (!window.confirm(`Send ${massCredits} credits to ALL ${users.length} users?`)) return;

    setIsSendingMass(true);
    try {
      const batch = writeBatch(db);
      users.forEach(u => {
        const userRef = doc(db, 'users', u.uid);
        batch.update(userRef, { credits: increment(massCredits) });
      });
      await batch.commit();
      alert(`Successfully sent ${massCredits} credits to ${users.length} users!`);
      setMassCredits(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/mass-update');
    } finally {
      setIsSendingMass(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 text-center">You do not have permission to view this page.</p>
        <button onClick={onBack} className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        </div>
        <button
          onClick={() => onNavigate('submit')}
          className="ml-auto bg-indigo-50 text-indigo-600 p-2 rounded-xl flex items-center gap-2 text-xs font-bold"
        >
          <Plus size={16} />
          Submit App
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('apps')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'apps' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Briefcase size={18} />
          Apps
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Users size={18} />
          Users
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'tools' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Send size={18} />
          Tools
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'apps' && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Manage Apps ({apps.length})</h2>
              {apps.map((app) => (
                <div key={app.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  {editingApp === app.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editAppData.name || app.name}
                        onChange={(e) => setEditAppData({ ...editAppData, name: e.target.value })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
                        placeholder="App Name"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={editAppData.credits ?? app.credits}
                          onChange={(e) => setEditAppData({ ...editAppData, credits: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
                          placeholder="Credits"
                        />
                        <input
                          type="number"
                          value={editAppData.testersRequired ?? app.testersRequired}
                          onChange={(e) => setEditAppData({ ...editAppData, testersRequired: parseInt(e.target.value) })}
                          className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm"
                          placeholder="Testers Needed"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateApp(app.id)} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2">
                          <Check size={18} /> Save
                        </button>
                        <button onClick={() => setEditingApp(null)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2">
                          <X size={18} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50">
                        {app.iconUrl ? (
                          <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-bold">
                            {app.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">{app.name}</h3>
                        <p className="text-slate-500 text-[10px] truncate">By {app.developerName} • {app.credits} Credits</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingApp(app.id); setEditAppData(app); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Manage Users ({users.length})</h2>
              {users.map((u) => (
                <div key={u.uid} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-600 font-bold">
                          {u.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate text-sm flex items-center gap-2">
                        {u.name}
                        {u.joinedGroup && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </h3>
                      <p className="text-slate-500 text-[10px] truncate">{u.email}</p>
                    </div>
                    {editingUser === u.uid ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editUserCredits}
                          onChange={(e) => setEditUserCredits(parseInt(e.target.value))}
                          className="w-20 bg-slate-50 border-none rounded-lg p-2 text-xs font-bold"
                        />
                        <button onClick={() => handleUpdateUserCredits(u.uid)} className="p-2 bg-indigo-600 text-white rounded-lg">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                            <Coins size={14} />
                            {u.credits}
                          </div>
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                            {u.role}
                          </span>
                        </div>
                        <button onClick={() => { setEditingUser(u.uid); setEditUserCredits(u.credits); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <Coins size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Mass Credit Distribution</h3>
                    <p className="text-slate-500 text-xs">Send credits to all registered users at once.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Amount to Send</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setMassCredits(Math.max(0, massCredits - 10))} className="p-3 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-transform">
                        <Minus size={20} />
                      </button>
                      <div className="flex-1 bg-slate-50 rounded-2xl py-4 text-center font-bold text-2xl text-slate-900">
                        {massCredits}
                      </div>
                      <button onClick={() => setMassCredits(massCredits + 10)} className="p-3 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-transform">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleMassSendCredits}
                    disabled={massCredits <= 0 || isSendingMass}
                    className="w-full bg-indigo-600 disabled:bg-slate-200 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSendingMass ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={20} />
                        Distribute to {users.length} Users
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2">Admin Tip</h3>
                <p className="text-indigo-700 text-sm leading-relaxed">
                  Use the mass distribution tool sparingly to maintain the value of credits in the ecosystem. Credits are primarily earned by testing apps.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
