import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiKeySelector } from './components/ApiKeySelector';
import { MovieGenerator } from './components/MovieGenerator';
import { ImageStudio } from './components/ImageStudio';
import { Chatbot } from './components/Chatbot';
import { LiveChat } from './components/LiveChat';
import { CreativeStudio } from './components/CreativeStudio';

type ActiveTab = 'studio' | 'movie' | 'image' | 'chat' | 'live';

const App: React.FC = () => {
  const [isApiKeyReady, setIsApiKeyReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsApiKeyReady(hasKey);
    } else {
        // For local development or environments without the aistudio host
        setIsApiKeyReady(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);
  
  const renderContent = () => {
    if (!isApiKeyReady) {
      return <ApiKeySelector onKeySelected={() => setIsApiKeyReady(true)} />;
    }

    switch (activeTab) {
      case 'studio':
        return <CreativeStudio onApiKeyError={() => setIsApiKeyReady(false)} />;
      case 'movie':
        return <MovieGenerator onApiKeyError={() => setIsApiKeyReady(false)} />;
      case 'image':
        return <ImageStudio />;
      case 'chat':
        return <Chatbot />;
      case 'live':
        return <LiveChat />;
      default:
        return <CreativeStudio onApiKeyError={() => setIsApiKeyReady(false)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative w-full max-w-6xl mx-auto">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="mt-8 animate-fade-in">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;