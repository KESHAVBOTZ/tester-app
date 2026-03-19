import React from 'react';
import { Users, ExternalLink, CheckCircle2, ChevronRight, Info, Copy, X } from 'lucide-react';
import { db, doc, updateDoc } from '../firebase';
import { UserProfile } from '../types';

interface WelcomeModalProps {
  user: UserProfile;
  onClose: () => void;
}

export default function WelcomeModal({ user, onClose }: WelcomeModalProps) {
  const [step, setStep] = React.useState(1);
  const [isJoining, setIsJoining] = React.useState(false);
  const [showHowTo, setShowHowTo] = React.useState(false);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        joinedGroup: true
      });
      setStep(4);
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col relative">
        {showHowTo && (
          <div className="absolute inset-0 z-50 bg-white p-8 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">How to Join</h3>
              <button 
                onClick={() => setShowHowTo(false)}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">Step 1: Join Group</p>
                <p>Click the "Join Google Group" button. It will open a new tab. Click the blue "Join Group" button on the Google Groups page.</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">Step 2: Add to Console</p>
                <p>Copy the group email: <span className="font-mono bg-slate-100 px-1 rounded text-xs">apptester07@googlegroups.com</span></p>
                <p>Go to your Google Play Console, navigate to "Closed Testing", and add this email to your "Testers" list.</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">Step 3: Verify</p>
                <p>Once you've done both, click "Finish & Start" to unlock the platform.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHowTo(false)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold mt-8"
            >
              Got it!
            </button>
          </div>
        )}

        <div className="p-8 overflow-y-auto">
          {step === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to Closedtest pro</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Just 2 quick and easy steps
              </p>
              <p className="text-xs text-slate-400 mb-8">
                We'll help you get real testers for your app - 12 real people, testing your app for 14 days. No chasing, no stress. And it's 100% free.
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-xl font-bold text-slate-900">Join Google Group</h2>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tap below to join our Google Group — this connects you with other developers and unlocks access to our testing platform.
                </p>
              </div>

              <div className="flex gap-3 mb-8">
                <a 
                  href="https://groups.google.com/g/apptester07" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setHasJoined(true)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <ExternalLink size={14} /> Join Google Group
                </a>
                <button 
                  onClick={() => setShowHowTo(true)}
                  className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Info size={14} /> How-to
                </button>
              </div>

              {!hasJoined && <p className="text-[10px] text-red-500 mb-6 text-center">Oops! Please complete this step before moving on.</p>}

              <button
                onClick={() => setStep(3)}
                disabled={!hasJoined}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-xl font-bold text-slate-900">Add Group In Testers</h2>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Copy our tester google group email below and paste it into your app's "Testers" list in the Google Play Console. This allows our 12 real testers to access your app.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 relative group">
                <p className="text-[10px] font-mono text-slate-600 break-all pr-8">
                  apptester07@googlegroups.com
                </p>
                <button 
                  onClick={() => {
                    copyToClipboard('apptester07@googlegroups.com');
                    setHasCopied(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Copy size={16} />
                </button>
                <p className="text-[10px] text-slate-400 mt-2">Click the icon to copy</p>
              </div>

              <div className="flex gap-3 mb-8">
                <a 
                  href="https://play.google.com/console" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <ExternalLink size={14} /> Go to Console
                </a>
                <button 
                  onClick={() => setShowHowTo(true)}
                  className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Info size={14} /> How-to
                </button>
              </div>

              {!hasCopied && <p className="text-[10px] text-red-500 mb-6 text-center">Oops! Please complete this step before moving on.</p>}

              <button
                onClick={handleJoin}
                disabled={isJoining || !hasCopied}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {isJoining ? 'Verifying...' : 'Finish & Start'}
              </button>
            </div>
          )}

          {step === 4 && (
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
