
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ChatPage } from './pages/ChatPage';
import { WritingPage } from './pages/WritingPage';
import { VoicePage } from './pages/VoicePage';
import { Settings } from './pages/Settings';
import { HomeworkPage } from './pages/HomeworkPage';
import { Language, Theme } from './types';

const App: React.FC = () => {
  useEffect(() => {
    // 1. Sync Theme
    const theme = localStorage.getItem('eyad-ai-theme') || Theme.DARK;
    document.documentElement.classList.toggle('dark', theme === Theme.DARK);

    // 2. Sync Language & Direction
    const lang = (localStorage.getItem('eyad-ai-lang') as Language) || Language.AR;
    const isRTL = lang === Language.AR || lang === Language.DIALECT;
    
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // 3. Set Body Class for Font Handling
    document.body.className = isRTL ? 'arabic-text' : 'english-text';
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/homework" element={<HomeworkPage />} />
          <Route path="/writing" element={<WritingPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
