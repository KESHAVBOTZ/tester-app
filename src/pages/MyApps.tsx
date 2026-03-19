import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, collection, query, where, onSnapshot, getDoc, doc, OperationType, handleFirestoreError } from '../firebase';
import { AppModel, TestRecord } from '../types';
import { ArrowLeft, ChevronRight, Briefcase, FlaskConical, ExternalLink } from 'lucide-react';

interface MyAppsPageProps {
  onBack: () => void;
  onSelectApp: (id: string) => void;
}

export default function MyAppsPage({ onBack, onSelectApp }: MyAppsPageProps) {
  const { user } = useAuth();
  const [publishedApps, setPublishedApps] = useState<AppModel[]>([]);
  const [testedApps, setTestedApps] = useState<AppModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch published apps
    const publishedQuery = query(collection(db, 'apps'), where('developerId', '==', user.uid));
    const unsubscribePublished = onSnapshot(publishedQuery, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppModel));
      setPublishedApps(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'apps?developerId=' + user.uid);
    });

    // 2. Fetch tested apps
    const testsQuery = query(collection(db, 'tests'), where('userId', '==', user.uid));
    const unsubscribeTests = onSnapshot(testsQuery, async (snapshot) => {
      const tests = snapshot.docs.map(doc => doc.data() as TestRecord);
      const appPromises = tests.map(test => getDoc(doc(db, 'apps', test.appId)));
      const appSnapshots = await Promise.all(appPromises);
      
      const appsWithStatus = appSnapshots
        .filter(snap => snap.exists())
        .map(snap => {
          const appData = snap.data() as AppModel;
          const test = tests.find(t => t.appId === snap.id);
          return { 
            ...appData, 
            id: snap.id,
            isCompleted: test?.completed || false 
          };
        });
        
      setTestedApps(appsWithStatus as any);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tests?userId=' + user.uid);
    });

    return () => {
      unsubscribePublished();
      unsubscribeTests();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">My Apps</h1>
      </div>

      <div className="space-y-8">
        {/* Published Apps Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Briefcase size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Published Apps</h2>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>)}
              </div>
            ) : publishedApps.length > 0 ? (
              publishedApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app.id)}
                  className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-50 flex-shrink-0">
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
                    <p className="text-slate-500 text-xs">{app.testersJoined}/{app.testersRequired} Testers</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                    Published
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              ))
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">You haven't published any apps yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Tested Apps Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 ml-1">
            <FlaskConical size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Tested Apps</h2>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>)}
              </div>
            ) : testedApps.length > 0 ? (
              testedApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app.id)}
                  className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-50 flex-shrink-0">
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
                    <p className="text-slate-500 text-xs">{app.developerName}</p>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${
                    (app as any).isCompleted 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {(app as any).isCompleted ? 'Completed' : 'Testing'}
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              ))
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">You haven't tested any apps yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
