import React from 'react';
import { Users, ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react';
import { db, doc, updateDoc } from '../firebase';
import { UserProfile } from '../types';

interface WelcomeModalProps {
  user: UserProfile;
  onClose: () => void;
}

export default function WelcomeModal({ user, onClose }: WelcomeModalProps) {
  const [step, setStep] = React.useState(1);
  const [isJoining, setIsJoining] = React.useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    // In a real app, we'd verify this, but for now we'll just update the user profile
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        joinedGroup: true
      });
      setStep(3);
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to AppTester</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                To start testing apps and earning credits, you need to join our Google Group first. This is required by Google Play Console.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Join Google Group</h2>
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1">Join the Group</p>
                    <p className="text-xs text-slate-500 mb-2">Click the button below to join our official tester group on Google Groups.</p>
                    <a 
                      href="https://groups.google.com/g/apptester07" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Open Google Group <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1">Confirm Membership</p>
                    <p className="text-xs text-slate-500">Once you've joined, come back here and click "I have joined" to unlock the platform.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {isJoining ? 'Verifying...' : 'I have joined'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">All Set!</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                You've successfully joined the group. You can now start testing apps and earn credits.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-100 active:scale-95 transition-all"
              >
                Start Testing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
