import React, { useState, useEffect } from 'react';
import { historyService, type HistoryItem } from '../services/historyService';
import { FilmIcon, WandIcon, ChatBubbleIcon, TrashIcon, DownloadIcon } from './icons';

interface HistoryGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'movie' | 'image' | 'chat' | 'all';
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ isOpen, onClose, type = 'all' }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'movie' | 'image' | 'chat'>('all');

  useEffect(() => {
    if (isOpen) {
      const filteredHistory = type === 'all' 
        ? historyService.getHistory()
        : historyService.getHistoryByType(type);
      setHistory(filteredHistory);
      setSelectedTab(type === 'all' ? 'all' : type);
    }
  }, [isOpen, type]);

  const handleTabChange = (tab: 'all' | 'movie' | 'image' | 'chat') => {
    setSelectedTab(tab);
    if (tab === 'all') {
      setHistory(historyService.getHistory());
    } else {
      setHistory(historyService.getHistoryByType(tab));
    }
  };

  const handleDelete = (id: string) => {
    historyService.removeFromHistory(id);
    if (selectedTab === 'all') {
      setHistory(historyService.getHistory());
    } else {
      setHistory(historyService.getHistoryByType(selectedTab));
    }
  };

  const handleDownload = (item: HistoryItem) => {
    if (item.url) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = item.url;
      link.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${item.type === 'movie' ? 'webm' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getTypeIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'movie': return FilmIcon;
      case 'image': return WandIcon;
      case 'chat': return ChatBubbleIcon;
      default: return FilmIcon;
    }
  };

  const formatCreatedAt = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-dark rounded-2xl border border-slate-700/30 w-full max-w-6xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/30">
          <h2 className="font-orbitron text-2xl font-bold text-cyan-400">Creation History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/30">
          {[
            { id: 'all', label: 'All' },
            { id: 'movie', label: 'Movies' },
            { id: 'image', label: 'Images' },
            { id: 'chat', label: 'Chats' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <WandIcon className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-400">No {selectedTab === 'all' ? 'creations' : selectedTab}s yet</p>
              <p className="text-sm text-slate-500 mt-2">Start creating to see your history here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <div key={item.id} className="glass rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/50 transition-all group">
                    <div className="relative">
                      {/* Preview */}
                      {item.url ? (
                        <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden mb-3">
                          {item.type === 'movie' ? (
                            <video 
                              src={item.url} 
                              className="w-full h-full object-cover"
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                              muted
                            />
                          ) : (
                            <img 
                              src={item.url} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                          <Icon className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-xs text-white rounded-full">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-red-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                        {item.url && (
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-1.5 bg-green-600/80 backdrop-blur-sm text-white rounded-lg hover:bg-green-500 transition-colors"
                          >
                            <DownloadIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-medium text-white mb-1 truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2" title={item.prompt}>
                        {item.prompt}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{formatCreatedAt(item.createdAt)}</span>
                        {item.metadata?.duration && (
                          <span>{Math.floor(item.metadata.duration / 60)}:{(item.metadata.duration % 60).toString().padStart(2, '0')}</span>
                        )}
                      </div>
                      
                      {/* Settings */}
                      {item.settings && (
                        <div className="flex gap-2 mt-2">
                          {item.settings.model && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">
                              {item.settings.model}
                            </span>
                          )}
                          {item.settings.aspectRatio && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {item.settings.aspectRatio}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700/30">
          <p className="text-sm text-slate-400">
            {history.length} item{history.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all history?')) {
                historyService.clearHistory();
                setHistory([]);
              }
            }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
