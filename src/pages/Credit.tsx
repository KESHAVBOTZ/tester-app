import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, collection, query, where, onSnapshot, OperationType, handleFirestoreError } from '../firebase';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Coins, CreditCard } from 'lucide-react';

interface CreditRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  credits: number;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface CreditPageProps {
  onBack: () => void;
}

export default function CreditPage({ onBack }: CreditPageProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'credit_requests'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CreditRequest[];
      
      setRequests(reqs.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'credit_requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">My Credit Requests</h1>
      </div>

      <div className="bg-indigo-50 p-6 rounded-3xl mb-8 flex items-center justify-between border border-indigo-100">
        <div>
          <p className="text-indigo-600 text-sm font-bold uppercase tracking-wider mb-1">Current Balance</p>
          <div className="flex items-center gap-2">
            <Coins size={24} className="text-indigo-500" />
            <span className="text-3xl font-black text-slate-900">{user?.credits || 0}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <CreditCard size={24} className="text-indigo-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4 pb-12">
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <Clock size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm font-medium">No credit requests found</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{req.credits} Credits</h3>
                    <p className="text-slate-500 text-xs">{req.amount}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {req.status === 'approved' && <CheckCircle2 size={12} />}
                    {req.status === 'rejected' && <XCircle size={12} />}
                    {req.status === 'pending' && <Clock size={12} />}
                    {req.status}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>ID: {req.id}</span>
                  <span>{req.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
