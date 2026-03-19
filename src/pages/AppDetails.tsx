import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, Timestamp, OperationType, handleFirestoreError, query, collection, where, onSnapshot, arrayUnion } from '../firebase';
import { AppModel, TestRecord } from '../types';
import { ArrowLeft, MoreVertical, ExternalLink, Info, CheckCircle, Coins, Calendar, User, Share2, Copy, Play, AlertCircle, Users } from 'lucide-react';
import WelcomeModal from '../components/WelcomeModal';

interface AppDetailsPageProps {
  appId: string;
  onBack: () => void;
}

export default function AppDetailsPage({ appId, onBack }: AppDetailsPageProps) {
  const { user, refreshUser } = useAuth();
  const [app, setApp] = useState<AppModel | null>(null);
  const [testRecord, setTestRecord] = useState<TestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [allFeedbacks, setAllFeedbacks] = useState<TestRecord[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  const isDeveloperInactive = app?.developerLastActiveAt 
    ? (Date.now() - app.developerLastActiveAt.toDate().getTime()) > 14 * 24 * 60 * 60 * 1000
    : false;

  const dailyOpensCount = testRecord?.dailyOpens?.length || 0;
  const isTestingFinished = dailyOpensCount >= 14;

  const canOpenToday = () => {
    if (!testRecord?.dailyOpens || testRecord.dailyOpens.length === 0) return true;
    const lastOpen = testRecord.dailyOpens[testRecord.dailyOpens.length - 1].toDate();
    const today = new Date();
    return lastOpen.toDateString() !== today.toDateString();
  };

  useEffect(() => {
    const fetchAppAndTest = async () => {
      if (!user) return; // Don't fetch if user is not available yet
      try {
        const appDoc = await getDoc(doc(db, 'apps', appId));
        if (appDoc.exists()) {
          const appData = { id: appDoc.id, ...appDoc.data() } as AppModel;
          setApp(appData);

          // If current user is the developer, fetch all feedbacks for this app
          if (user && appData.developerId === user.uid) {
            const q = query(collection(db, 'tests'), where('appId', '==', appId), where('completed', '==', true));
            const unsubscribe = onSnapshot(q, (snapshot) => {
              const feedbacks = snapshot.docs.map(doc => doc.data() as TestRecord);
              setAllFeedbacks(feedbacks);
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, `tests?appId=${appId}`);
            });
            return () => unsubscribe();
          }
        } else {
          console.error("App not found");
        }

        if (user) {
          const testId = `${user.uid}_${appId}`;
          try {
            const testDoc = await getDoc(doc(db, 'tests', testId));
            if (testDoc.exists()) {
              setTestRecord(testDoc.data() as TestRecord);
            }
          } catch (testError) {
            // It's okay if the test record doesn't exist yet for a new tester
            console.log("No test record found for this user/app combination");
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `apps/${appId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAppAndTest();
  }, [appId, user]);

  const handleStartTesting = async () => {
    if (!user || !app) return;
    
    if (!user.joinedGroup) {
      setShowWelcome(true);
      return;
    }

    setActionLoading(true);

    try {
      const testId = `${user.uid}_${appId}`;
      
      // 1. Create test record
      const newTest: TestRecord = {
        id: testId,
        userId: user.uid,
        appId: appId,
        startDate: serverTimestamp() as any,
        completed: false,
        dailyOpens: [Timestamp.now()] // Use Timestamp.now() instead of serverTimestamp() inside array
      };
      await setDoc(doc(db, 'tests', testId), newTest);
      setTestRecord(newTest);

      // 2. Increment testersJoined in app
      await updateDoc(doc(db, 'apps', appId), {
        testersJoined: increment(1)
      });

      // 4. Update user testing progress
      const today = new Date().toDateString();
      const lastTested = user.lastTestedAt ? new Date(user.lastTestedAt.toDate()).toDateString() : null;
      
      if (today !== lastTested) {
        await updateDoc(doc(db, 'users', user.uid), {
          testingDays: increment(1),
          lastTestedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActiveAt: serverTimestamp()
        });
      }

      // 5. Open Play Store link
      window.open(app.playStoreLink, '_blank');
      await refreshUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tests/${user.uid}_${appId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenApp = async () => {
    if (!user || !app || !testRecord) return;

    if (!user.joinedGroup) {
      setShowWelcome(true);
      return;
    }

    if (!canOpenToday()) {
      alert('You have already opened this app today. Come back tomorrow!');
      return;
    }

    setActionLoading(true);
    try {
      const testId = `${user.uid}_${appId}`;
      await updateDoc(doc(db, 'tests', testId), {
        dailyOpens: arrayUnion(Timestamp.now())
      });
      
      // Update local state for immediate feedback
      setTestRecord({
        ...testRecord,
        dailyOpens: [...(testRecord.dailyOpens || []), { toDate: () => new Date() } as any]
      });

      // Update user testing progress
      const today = new Date().toDateString();
      const lastTested = user.lastTestedAt ? new Date(user.lastTestedAt.toDate()).toDateString() : null;
      
      if (today !== lastTested) {
        await updateDoc(doc(db, 'users', user.uid), {
          testingDays: increment(1),
          lastTestedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActiveAt: serverTimestamp()
        });
      }
      
      window.open(app.playStoreLink, '_blank');
      await refreshUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tests/${testRecord.id}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTest = async () => {
    if (!user || !app || !testRecord) return;
    if (!feedback.trim()) {
      alert('Please provide feedback before completing the test.');
      return;
    }
    if (!isTestingFinished) {
      alert(`Please test the app for 14 days. You have tested for ${dailyOpensCount} days.`);
      return;
    }
    
    setActionLoading(true);

    try {
      const testId = `${user.uid}_${appId}`;
      
      // 1. Update test record
      await updateDoc(doc(db, 'tests', testId), {
        completed: true,
        completedAt: serverTimestamp(),
        feedback: feedback.trim()
      });
      setTestRecord({ ...testRecord, completed: true, feedback: feedback.trim() });

      // 2. Award credits to user
      await updateDoc(doc(db, 'users', user.uid), {
        credits: increment(20) // Always 20 credits as per requirement
      });

      await refreshUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tests/${user.uid}_${appId}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">App not found</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {showWelcome && user && <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />}
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">App Details</h1>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              const url = `${window.location.origin}/?app=${appId}`;
              navigator.clipboard.writeText(url);
              alert('Testing link copied to clipboard!');
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Copy Testing Link"
          >
            <Copy size={20} className="text-slate-600" />
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Test ${app.name} on AppTest Hub`,
                  text: `Help me test my app and earn credits!`,
                  url: `${window.location.origin}/?app=${appId}`
                });
              } else {
                alert('Sharing not supported on this browser');
              }
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Share2 size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-6 mb-8">
        <div className="w-full aspect-video bg-gradient-to-br from-yellow-200 via-green-300 to-emerald-400 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 z-10">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                {app.name[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-6 space-y-6 flex-1">
        <div className="grid grid-cols-2 gap-y-4">
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">App name</p>
            <p className="font-bold text-slate-900 truncate">{app.name}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-slate-400 text-sm">Developed by</p>
            <p className="font-bold text-slate-900 truncate">{app.developerName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-sm">Posted on</p>
            <p className="font-bold text-slate-900 truncate">
              {app.createdAt && typeof app.createdAt.toDate === 'function' 
                ? app.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Just now'}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-slate-400 text-sm">Credits</p>
            <p className="font-bold text-slate-900">{app.credits}</p>
          </div>
        </div>

        <div className="h-px bg-slate-100"></div>

        {/* Testing Instructions */}
        <div>
          <h2 className="text-indigo-600 font-bold mb-4">Testing Instructions</h2>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
            <div className="flex gap-3">
              <Calendar size={18} className="text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-600">Keep testing the app for the next <span className="font-bold text-slate-900">{app.testingTime || 14} days</span>.</p>
            </div>
            <div className="flex gap-3">
              <Info size={18} className="text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-600">App name: <span className="font-bold text-slate-900">{app.name}</span></p>
            </div>
            {app.description && (
              <div className="flex gap-3">
                <Info size={18} className="text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-600">Description: {app.description}</p>
              </div>
            )}
            <div className="flex gap-3">
              <ExternalLink size={18} className="text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-600 truncate">Opt-in link: <span className="text-indigo-600 underline">{app.playStoreLink}</span></p>
            </div>
          </div>
        </div>

        {/* Developer Inactivity Warning */}
        {isDeveloperInactive && (
          <div className="bg-red-50 p-4 rounded-2xl flex items-start gap-3 border border-red-100">
            <AlertCircle size={20} className="text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-900 font-bold">App Locked</p>
              <p className="text-xs text-red-700 mt-1">
                The developer of this app has been inactive for more than 14 days. This app cannot be opened until the developer becomes active again.
              </p>
            </div>
          </div>
        )}

        {/* Testing Progress */}
        {testRecord && !testRecord.completed && (
          <div className="bg-indigo-50 p-4 rounded-2xl space-y-3 border border-indigo-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-900">Testing Progress</h3>
              <span className="text-xs font-bold text-indigo-600">{dailyOpensCount}/14 Days</span>
            </div>
            <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500" 
                style={{ width: `${(dailyOpensCount / 14) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-indigo-700">
              Open the app daily for 14 days to earn 20 credits.
            </p>
          </div>
        )}

        {/* Feedback Section */}
        {testRecord && !testRecord.completed && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-indigo-600 font-bold">Your Feedback</h2>
              {!canOpenToday() && (
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <CheckCircle size={12} />
                  Opened Today
                </div>
              )}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell the developer what you liked or what needs improvement..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
            <p className="text-[10px] text-slate-400 italic">
              * Feedback is required to complete the test and earn credits.
            </p>
          </div>
        )}

        {/* Completed Feedback */}
        {testRecord?.completed && testRecord.feedback && (
          <div className="space-y-2">
            <h2 className="text-indigo-600 font-bold">Your Feedback</h2>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-800 italic">
              "{testRecord.feedback}"
            </div>
          </div>
        )}

        {/* Developer Feedback View */}
        {user && app.developerId === user.uid && (
          <div className="space-y-4 pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-indigo-600 font-bold">Tester Feedbacks ({allFeedbacks.length})</h2>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {app.testersJoined} / {app.testersRequired} Joined
              </div>
            </div>
            
            {allFeedbacks.length > 0 ? (
              <div className="space-y-3">
                {allFeedbacks.map((fb, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                        T{idx + 1}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {fb.completedAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{fb.feedback}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No feedbacks received yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="p-6 sticky bottom-0 bg-white border-t border-slate-50">
        {!user ? (
          <div className="text-center p-4 bg-slate-50 rounded-2xl text-slate-500 text-sm">
            Please login to start testing
          </div>
        ) : testRecord?.completed ? (
          <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-emerald-100">
            <CheckCircle size={20} />
            Test Completed
          </div>
        ) : testRecord ? (
          <div className="flex flex-col gap-3">
            {!isTestingFinished && (
              <button
                onClick={handleOpenApp}
                disabled={actionLoading || !canOpenToday() || isDeveloperInactive}
                className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  !canOpenToday() || isDeveloperInactive
                    ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                    : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                }`}
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Play size={20} />
                    {!canOpenToday() ? 'Already Opened Today' : isDeveloperInactive ? 'App Locked' : 'Open App'}
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleCompleteTest}
              disabled={actionLoading || !isTestingFinished || !feedback.trim()}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                !isTestingFinished || !feedback.trim()
                  ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                  : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
              }`}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {isTestingFinished ? 'Complete Test & Earn 20 Credits' : `${14 - dailyOpensCount} Days Remaining`}
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartTesting}
            disabled={actionLoading || app.testersJoined >= app.testersRequired || isDeveloperInactive}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              app.testersJoined >= app.testersRequired || isDeveloperInactive
                ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
            }`}
          >
            {actionLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : isDeveloperInactive ? (
              'App Locked'
            ) : app.testersJoined >= app.testersRequired ? (
              'Testers Limit Reached'
            ) : (
              'Start Testing'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
