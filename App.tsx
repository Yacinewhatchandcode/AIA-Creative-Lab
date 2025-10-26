import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiKeySelector } from './components/ApiKeySelector';
import { MovieGenerator } from './components/MovieGenerator';
import { ImageStudio } from './components/ImageStudio';
import { Chatbot } from './components/Chatbot';
import { LiveChat } from './components/LiveChat';

type ActiveTab = 'movie' | 'image' | 'chat' | 'live';

const App: React.FC = () => {
  const [isApiKeyReady, setIsApiKeyReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('movie');

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
      case 'movie':
        return <MovieGenerator onApiKeyError={() => setIsApiKeyReady(false)} />;
      case 'image':
        return <ImageStudio />;
      case 'chat':
        return <Chatbot />;
      case 'live':
        return <LiveChat />;
      default:
        return <MovieGenerator onApiKeyError={() => setIsApiKeyReady(false)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="mt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;