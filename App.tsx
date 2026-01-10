
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ChatPage } from './pages/ChatPage';
import { WritingPage } from './pages/WritingPage';
import { VoicePage } from './pages/VoicePage';
import { Settings } from './pages/Settings';
import { HomeworkPage } from './pages/HomeworkPage';
import { Theme } from './types';

const App: React.FC = () => {
  useEffect(() => {
    const theme = localStorage.getItem('eyad-ai-theme') || Theme.DARK;
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
