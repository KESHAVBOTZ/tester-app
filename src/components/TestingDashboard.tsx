import React from 'react';
import { UserProfile } from '../types';
import { Calendar, CheckCircle2, AlertCircle, ChevronRight, Info } from 'lucide-react';

interface TestingDashboardProps {
  user: UserProfile;
}

export default function TestingDashboard({ user }: TestingDashboardProps) {
  const testingDays = user.testingDays || 0;
  const progress = (testingDays / 14) * 100;
  
  // Check if user has tested today
  const hasTestedToday = user.lastTestedAt ? 
    new Date(user.lastTestedAt.toDate()).toDateString() === new Date().toDateString() : 
    false;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm mb-8 overflow-hidden relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Testing Progress</h2>
          <p className="text-xs text-slate-500 font-medium">Day {testingDays} of 14</p>
        </div>
        <div className={`p-2 rounded-2xl ${hasTestedToday ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
          {hasTestedToday ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Status</p>
          <p className={`text-sm font-bold ${hasTestedToday ? 'text-emerald-600' : 'text-orange-600'}`}>
            {hasTestedToday ? 'Completed' : 'Pending'}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Days</p>
          <p className="text-sm font-bold text-slate-900">{testingDays} Days</p>
        </div>
      </div>

      {!hasTestedToday && (
        <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex items-start gap-3 mb-4">
          <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
            Open at least one app from the list below to complete today's testing requirement.
          </p>
        </div>
      )}

      <button className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors py-2 px-2">
        <span>How it works?</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
