import { useState } from 'react';
import { ArrowLeft, ChevronRight, HelpCircle, Headphones, Users, Moon, Shield, Mail } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Settings Page</h1>
      </div>

      <div className="space-y-8">
        {/* App Section */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">App Section</h3>
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm shadow-slate-50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <HelpCircle size={20} />
                </div>
                <span className="font-semibold text-slate-700">FAQs</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Headphones size={20} />
                </div>
                <span className="font-semibold text-slate-700">Support</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Users size={20} />
                </div>
                <span className="font-semibold text-slate-700">Join Google Group</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>

        {/* Other Settings */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-2">Other Settings</h3>
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm shadow-slate-50">
            <div className="w-full flex items-center justify-between p-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                  <Moon size={20} />
                </div>
                <span className="font-semibold text-slate-700">Switch Dark Mode</span>
              </div>
              <div 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${darkMode ? 'left-7' : 'left-1'}`}></div>
              </div>
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                  <Shield size={20} />
                </div>
                <span className="font-semibold text-slate-700">Policies</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          </div>
        </section>

        {/* Contact Button */}
        <div className="flex justify-center pt-4">
          <button className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-full font-bold hover:bg-indigo-50 transition-colors active:scale-95">
            <Mail size={18} />
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
