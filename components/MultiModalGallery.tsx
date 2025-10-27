import React, { useState } from 'react';

interface Asset {
  id: string;
  type: 'video' | 'image' | 'audio' | 'script';
  title: string;
  thumbnail?: string;
  url: string;
  timestamp: Date;
  duration?: number;
  metadata?: {
    agent?: string;
    style?: string;
    prompt?: string;
  };
}

export const MultiModalGallery: React.FC = () => {
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      type: 'video',
      title: 'Epic Space Journey',
      url: '#',
      timestamp: new Date(Date.now() - 3600000),
      duration: 60,
      metadata: {
        agent: 'Frame Master',
        style: 'Cinematic',
        prompt: 'Epic space journey with dramatic visuals',
      },
    },
    {
      id: '2',
      type: 'image',
      title: 'Scene 1 - Opening',
      url: '#',
      timestamp: new Date(Date.now() - 7200000),
      metadata: {
        agent: 'Frame Master',
        style: 'Realistic',
      },
    },
    {
      id: '3',
      type: 'audio',
      title: 'Epic Orchestral Theme',
      url: '#',
      timestamp: new Date(Date.now() - 10800000),
      duration: 30,
      metadata: {
        agent: 'Sound Engineer',
        style: 'Epic',
      },
    },
  ]);

  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'image' | 'audio' | 'script'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = selectedType === 'all' 
    ? assets 
    : assets.filter(a => a.type === selectedType);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'script': return '📝';
      default: return '📁';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'from-cyan-500 to-blue-500';
      case 'image': return 'from-purple-500 to-pink-500';
      case 'audio': return 'from-green-500 to-teal-500';
      case 'script': return 'from-yellow-500 to-orange-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="glass-dark rounded-2xl p-6 border border-cyan-500/20">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
              Asset Gallery
            </h3>
            <p className="text-slate-400 text-sm">Manage your creative assets</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
              title={viewMode === 'grid' ? 'List View' : 'Grid View'}
            >
              {viewMode === 'grid' ? (
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'video', 'image', 'audio', 'script'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${selectedType === type
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }
              `}
            >
              <span>{getTypeIcon(type)}</span>
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              <span className={`text-xs ${selectedType === type ? 'text-white/70' : 'text-slate-500'}`}>
                ({type === 'all' ? assets.length : assets.filter(a => a.type === type).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Assets display */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-slate-400">No assets found</p>
          <p className="text-sm text-slate-500 mt-2">Start creating to see your work here</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className={`
                group cursor-pointer
                bg-gradient-to-br from-slate-800/50 to-slate-900/50
                rounded-xl overflow-hidden
                border-2 border-slate-700/30
                hover:border-cyan-500/50
                transition-all duration-300
                hover:scale-105 hover:-translate-y-1
                ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''}
              `}
            >
              {/* Thumbnail */}
              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${getTypeColor(asset.type)}
                ${viewMode === 'grid' ? 'aspect-video' : 'w-24 h-24 rounded-lg flex-shrink-0'}
              `}>
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                  {getTypeIcon(asset.type)}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <button className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
                    Preview
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className={viewMode === 'grid' ? 'p-4' : 'flex-1'}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white text-sm truncate">
                    {asset.title}
                  </h4>
                  {asset.duration && (
                    <span className="text-xs text-slate-400 ml-2">
                      {formatDuration(asset.duration)}
                    </span>
                  )}
                </div>
                
                {asset.metadata?.agent && (
                  <p className="text-xs text-cyan-400 mb-1">
                    by {asset.metadata.agent}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{formatDate(asset.timestamp)}</span>
                  {asset.metadata?.style && (
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">
                      {asset.metadata.style}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected asset modal would go here */}
    </div>
  );
};
