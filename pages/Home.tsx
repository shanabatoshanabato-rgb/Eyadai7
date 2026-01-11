
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Settings } from 'lucide-react';
import { useTranslation } from '../translations';

export const Home: React.FC = () => {
  const t = useTranslation();
  
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 text-center bg-[#020617]">
      {/* Content Container */}
      <div className="relative z-10 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-700">
        
        {/* Hero Title - Clean and Focused */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
          Everything AI. <br />
          <span className="text-blue-600">All in one chat.</span>
        </h1>

        {/* Hero Subtext */}
        <p className="text-base md:text-lg text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
          Eyad AI is your intelligent partner for education and productivity. Get homework help, generate pro documents, and speak in real-time.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            to="/chat" 
            className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold text-base flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/10"
          >
            Start Chatting
            <MessageCircle className="w-4 h-4" />
          </Link>
          
          <Link 
            to="/settings" 
            className="px-8 py-3.5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-base flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
          >
            Configuration
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
