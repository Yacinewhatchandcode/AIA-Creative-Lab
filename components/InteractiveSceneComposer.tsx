import React, { useState } from 'react';

interface Scene {
  id: string;
  number: number;
  thumbnail?: string;
  title: string;
  duration: number;
  status: 'pending' | 'generating' | 'complete';
  prompt: string;
  visualStyle?: string;
  audioType?: string;
}

interface InteractiveSceneComposerProps {
  scenes: Scene[];
  onSceneEdit?: (scene: Scene) => void;
  onSceneReorder?: (scenes: Scene[]) => void;
}

export const InteractiveSceneComposer: React.FC<InteractiveSceneComposerProps> = ({
  scenes: initialScenes,
  onSceneEdit,
  onSceneReorder
}) => {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  const handleSceneClick = (scene: Scene) => {
    setSelectedScene(scene);
  };

  const getSceneColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'generating':
        return 'bg-cyan-500 animate-pulse';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="glass-dark rounded-2xl p-6 border border-purple-500/20">
      <div className="mb-6">
        <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          Interactive Scene Composer
        </h3>
        <p className="text-slate-400 text-sm">Timeline-based visual editor for your cinematic story</p>
      </div>

      {/* Timeline */}
      <div className="mb-6 space-y-4">
        {/* Playback controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center hover:scale-110 transition-transform"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Scene timeline */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {scenes.map((scene, index) => {
              const widthPercent = (scene.duration / totalDuration) * 100;
              const isSelected = selectedScene?.id === scene.id;

              return (
                <div
                  key={scene.id}
                  onClick={() => handleSceneClick(scene)}
                  className={`
                    relative flex-shrink-0 cursor-pointer
                    transition-all duration-300
                    ${isSelected ? 'scale-105 -translate-y-1' : 'hover:scale-102'}
                  `}
                  style={{ width: `${Math.max(widthPercent, 10)}%` }}
                >
                  <div className={`
                    h-20 rounded-lg overflow-hidden
                    border-2 ${isSelected ? 'border-cyan-500 shadow-lg shadow-cyan-500/30' : 'border-slate-600'}
                    bg-slate-800
                    group
                  `}>
                    {/* Thumbnail or placeholder */}
                    {scene.thumbnail ? (
                      <img src={scene.thumbnail} alt={scene.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-slate-400 text-2xl font-bold">{scene.number}</span>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getSceneColor(scene.status)}`}></div>

                    {/* Scene info overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs font-medium truncate">{scene.title}</p>
                      <p className="text-cyan-400 text-xs">{scene.duration}s</p>
                    </div>
                  </div>

                  {/* Connection line to next scene */}
                  {index < scenes.length - 1 && (
                    <div className="absolute top-1/2 -right-1 w-2 h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected scene details */}
      {selectedScene && (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-orbitron text-lg font-bold text-white mb-1">
                Scene {selectedScene.number}: {selectedScene.title}
              </h4>
              <p className="text-sm text-slate-400">Duration: {selectedScene.duration}s</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors">
                Edit
              </button>
              <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                Duplicate
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Scene Prompt</label>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-sm text-slate-300">{selectedScene.prompt}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Visual Style</label>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-sm text-cyan-400">{selectedScene.visualStyle || 'Cinematic'}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Audio</label>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-sm text-purple-400">{selectedScene.audioType || 'Suno AI Music'}</p>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs rounded-lg transition-colors border border-purple-500/30">
                Regenerate Frame
              </button>
              <button className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs rounded-lg transition-colors border border-cyan-500/30">
                Change Style
              </button>
              <button className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-xs rounded-lg transition-colors border border-pink-500/30">
                Add Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scene stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Total Scenes</p>
          <p className="text-xl font-bold text-white">{scenes.length}</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Completed</p>
          <p className="text-xl font-bold text-green-400">
            {scenes.filter(s => s.status === 'complete').length}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Generating</p>
          <p className="text-xl font-bold text-cyan-400">
            {scenes.filter(s => s.status === 'generating').length}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Total Duration</p>
          <p className="text-xl font-bold text-purple-400">{totalDuration}s</p>
        </div>
      </div>
    </div>
  );
};
