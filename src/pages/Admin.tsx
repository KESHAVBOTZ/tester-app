import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { db, collection, query, onSnapshot, doc, deleteDoc, updateDoc, increment, OperationType, handleFirestoreError, getDocs, writeBatch, serverTimestamp } from '../firebase';
import { AppModel, UserProfile } from '../types';
import { ArrowLeft, Trash2, Shield, AlertTriangle, Users, Briefcase, Send, Edit2, Check, X, Plus, Minus, Coins, CheckCircle2, BarChart2, Clock, TrendingUp, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface AdminPageProps {
  onBack: () => void;
  onSelectApp: (id: string) => void;
  onNavigate: (page: string) => void;
}

type AdminTab = 'apps' | 'users' | 'credits' | 'tools' | 'analytics';

export default function AdminPage({ onBack, onSelectApp, onNavigate }: AdminPageProps) {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppModel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('apps');
  
  // Edit States
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editAppData, setEditAppData] = useState<Partial<AppModel>>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserCredits, setEditUserCredits] = useState<number>(0);
  const [editUserRole, setEditUserRole] = useState<'user' | 'admin'>('user');
  const [userSearch, setUserSearch] = useState('');
  
  // Mass Send State
  const [massCredits, setMassCredits] = useState<number>(0);
  const [isSendingMass, setIsSendingMass] = useState(false);
  const [logins, setLogins] = useState<any[]>([]);
  const [testRecords, setTestRecords] = useState<any[]>([]);

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

    // Listen to Credit Requests
    const creditQuery = query(collection(db, 'credit_requests'));
    const unsubscribeCredits = onSnapshot(creditQuery, (snapshot) => {
      const creditsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCreditRequests(creditsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'credit_requests');
    });

    return () => {
      unsubscribeApps();
      unsubscribeUsers();
      unsubscribeCredits();
    };
  }, [user]);

  const handleApproveCredit = async (request: any) => {
    try {
      const batch = writeBatch(db);
      
      // Update request status
      batch.update(doc(db, 'credit_requests', request.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      
      // Add credits to user
      batch.update(doc(db, 'users', request.userId), {
        credits: increment(request.credits)
      });
      
      await batch.commit();
      alert(`Approved ${request.credits} credits for ${request.userName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `credit_requests/${request.id}`);
    }
  };

  const handleRejectCredit = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'credit_requests', requestId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `credit_requests/${requestId}`);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin' || activeTab !== 'analytics') return;

    const loginsQuery = query(collection(db, 'logins'));
    const unsubscribeLogins = onSnapshot(loginsQuery, (snapshot) => {
      const loginsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by timestamp descending
      loginsData.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });
      setLogins(loginsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logins');
    });

    const testsQuery = query(collection(db, 'tests'));
    const unsubscribeTests = onSnapshot(testsQuery, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestRecords(testsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tests');
    });

    return () => {
      unsubscribeLogins();
      unsubscribeTests();
    };
  }, [user, activeTab]);

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

  const handleUpdateUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        credits: editUserCredits,
        role: editUserRole
      });
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

  const loginStats = useMemo(() => {
    const byDay: Record<string, number> = {};
    const byUser: Record<string, { name: string, email: string, count: number }> = {};

    logins.forEach(login => {
      // By Day
      const date = login.timestamp?.toDate().toLocaleDateString() || 'Unknown';
      byDay[date] = (byDay[date] || 0) + 1;

      // By User
      const uid = login.uid;
      if (!byUser[uid]) {
        byUser[uid] = {
          name: login.name || 'Anonymous',
          email: login.email || 'No Email',
          count: 0
        };
      }
      byUser[uid].count += 1;
    });

    const chartData = Object.entries(byDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const topUsers = Object.values(byUser).sort((a, b) => b.count - a.count);

    return { chartData, topUsers };
  }, [logins]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const userStats = useMemo(() => {
    const admins = users.filter(u => u.role === 'admin').length;
    return { admins, total: users.length };
  }, [users]);

  const testingStats = useMemo(() => {
    const totalTests = testRecords.length;
    const completedTests = testRecords.filter(t => t.completed).length;
    const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;
    
    const appsWithTests = new Set(testRecords.map(t => t.appId)).size;
    
    let totalDuration = 0;
    let completedWithDuration = 0;
    
    testRecords.forEach(t => {
      if (t.completed && t.completedAt && t.startDate) {
        const duration = t.completedAt.toMillis() - t.startDate.toMillis();
        totalDuration += duration;
        completedWithDuration++;
      }
    });
    
    const avgDurationMs = completedWithDuration > 0 ? totalDuration / completedWithDuration : 0;
    const avgDurationDays = (avgDurationMs / (1000 * 60 * 60 * 24)).toFixed(1);

    // Completion trend
    const byDay: Record<string, number> = {};
    testRecords.forEach(t => {
      if (t.completed && t.completedAt) {
        const date = t.completedAt.toDate().toLocaleDateString();
        byDay[date] = (byDay[date] || 0) + 1;
      }
    });

    const trendData = Object.entries(byDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top apps by testers
    const appTesters: Record<string, number> = {};
    testRecords.forEach(t => {
      appTesters[t.appId] = (appTesters[t.appId] || 0) + 1;
    });

    const topAppsData = Object.entries(appTesters)
      .map(([appId, count]) => {
        const app = apps.find(a => a.id === appId);
        return {
          name: app?.name || 'Unknown',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTests,
      completedTests,
      completionRate: completionRate.toFixed(1),
      appsWithTests,
      avgDurationDays,
      trendData,
      topAppsData
    };
  }, [testRecords, apps]);

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
          onClick={() => setActiveTab('credits')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'credits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <CreditCard size={18} />
          Credits
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'tools' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Send size={18} />
          Tools
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
          <BarChart2 size={18} />
          Stats
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
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-2xl mb-4">
                <Users size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent border-none text-sm w-full focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Total Users</p>
                  <p className="text-xl font-bold text-indigo-900">{userStats.total}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Admins</p>
                  <p className="text-xl font-bold text-emerald-900">{userStats.admins}</p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    {editingUser === u.uid ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Credits</label>
                            <input
                              type="number"
                              value={editUserCredits}
                              onChange={(e) => setEditUserCredits(parseInt(e.target.value))}
                              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Role</label>
                            <select
                              value={editUserRole}
                              onChange={(e) => setEditUserRole(e.target.value as 'user' | 'admin')}
                              className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateUser(u.uid)} 
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <Check size={16} /> Save Changes
                          </button>
                          <button 
                            onClick={() => setEditingUser(null)} 
                            className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <X size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 font-bold border border-slate-100">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            u.name[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 truncate text-sm">{u.name}</h3>
                            {u.role === 'admin' && (
                              <span className="bg-indigo-50 text-indigo-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                            <span className="truncate">{u.email}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="font-bold text-slate-700">{u.credits} Credits</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'users', u.uid), { credits: increment(100) });
                                alert(`Sent 100 credits to ${u.name}`);
                              } catch (e) {
                                handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
                              }
                            }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Send 100 Credits"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingUser(u.uid);
                              setEditUserCredits(u.credits);
                              setEditUserRole(u.role);
                            }} 
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Credit Requests ({creditRequests.length})</h2>
              {creditRequests.map((req) => (
                <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{req.credits} Credits</h3>
                          <p className="text-slate-500 text-xs">{req.amount} • {req.userName}</p>
                          <p className="text-slate-400 text-[10px]">{req.userEmail}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {req.status}
                        </div>
                      </div>
                      
                      {req.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => handleApproveCredit(req)}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <Check size={14} /> Confirm & Approve
                          </button>
                          <button 
                            onClick={() => handleRejectCredit(req.id)}
                            className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      )}
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-50">
                    <span>ID: {req.id}</span>
                    <span>{req.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {creditRequests.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No credit requests found</p>
                </div>
              )}
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

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Login Analytics */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Login Analytics</h3>
                    <p className="text-slate-500 text-xs">Tracking user activity and logins.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Logins</p>
                      <p className="text-xl font-bold text-slate-900">{logins.length}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Users</p>
                      <p className="text-xl font-bold text-slate-900">{new Set(logins.map(l => l.uid)).size}</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-64">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Login Activity (Daily)</p>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={loginStats.chartData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Users */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Logins by User</h4>
                    <div className="space-y-3">
                      {loginStats.topUsers.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                          <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold">
                            {u.count} logins
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Recent Logins</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {logins.map((login) => (
                        <div key={login.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {login.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{login.name}</p>
                              <p className="text-[10px] text-slate-500">{login.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock size={12} />
                            <span className="text-[10px] font-medium">
                              {login.timestamp?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {logins.length === 0 && (
                        <p className="text-center py-8 text-slate-400 text-xs italic">No login data available yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Testing Analytics */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Testing Statistics</h3>
                    <p className="text-slate-500 text-xs">Performance and completion metrics.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Apps Tested</p>
                      <p className="text-lg font-bold text-slate-900">{testingStats.appsWithTests}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Time</p>
                      <p className="text-lg font-bold text-slate-900">{testingStats.avgDurationDays}d</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completion</p>
                      <p className="text-lg font-bold text-slate-900">{testingStats.completionRate}%</p>
                    </div>
                  </div>

                  {/* Trend Chart */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-64">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Test Completions (Daily)</p>
                    <ResponsiveContainer width="100%" height="80%">
                      <AreaChart data={testingStats.trendData}>
                        <defs>
                          <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCompletions)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Apps Chart */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 h-64">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Top Apps by Testers</p>
                    <ResponsiveContainer width="100%" height="80%">
                      <BarChart data={testingStats.topAppsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          width={80}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total Tests</p>
                      <p className="text-2xl font-bold text-emerald-900">{testingStats.totalTests}</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Completed</p>
                      <p className="text-2xl font-bold text-indigo-900">{testingStats.completedTests}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
