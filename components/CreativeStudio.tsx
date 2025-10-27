import React, { useState, useRef, useEffect } from 'react';
import { AgentOrchestrationDashboard } from './AgentOrchestrationDashboard';
import { AgentCommunicationFlow } from './AgentCommunicationFlow';
import { InteractiveSceneComposer } from './InteractiveSceneComposer';
import { AgentPerformanceMonitor } from './AgentPerformanceMonitor';
import { AgentControlPanel } from './AgentControlPanel';
import { AgentAvatars } from './AgentAvatars';
import { MultiModalGallery } from './MultiModalGallery';
import { PromptInput } from './PromptInput';
import { VideoPlayer } from './VideoPlayer';
import { runMovieGenerationPipeline } from '../services/backendService';
import type { AgentStep } from '../types';
import { JobStatus } from '../types';
import { PIPELINE_AGENTS } from '../constants';

type PanelType = 'dashboard' | 'flow' | 'composer' | 'analytics' | 'control' | 'team' | 'gallery';

interface CreativeStudioProps {
  onApiKeyError: () => void;
}

export const CreativeStudio: React.FC<CreativeStudioProps> = ({ onApiKeyError }) => {
  // Generation state
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>(JobStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(PIPELINE_AGENTS);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [numChunks, setNumChunks] = useState<number>(3);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  // UI state
  const [activePanel, setActivePanel] = useState<PanelType>('dashboard');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sidebarPanel, setSidebarPanel] = useState<'tools' | 'settings' | 'assets'>('tools');

  // Refs for video processing
  const frameExtractionVideoRef = useRef<HTMLVideoElement>(null);
  const frameExtractionCanvasRef = useRef<HTMLCanvasElement>(null);
  const concatenationVideoRef = useRef<HTMLVideoElement>(null);
  const concatenationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Mock scenes for composer (will be populated during generation)
  const [scenes, setScenes] = useState([
    { id: '1', number: 1, title: 'Opening Scene', duration: 20, status: 'pending' as const, prompt: 'Cinematic opening...' },
    { id: '2', number: 2, title: 'Rising Action', duration: 20, status: 'pending' as const, prompt: 'Action intensifies...' },
    { id: '3', number: 3, title: 'Climax', duration: 20, status: 'pending' as const, prompt: 'Epic conclusion...' },
  ]);

  const resetState = () => {
    setJobStatus(JobStatus.IDLE);
    setError(null);
    setFinalVideoUrl(null);
    setPipelineSteps(PIPELINE_AGENTS);
    setCurrentTask(null);
  };

  const handleProgressUpdate = (update: any) => {
    if (update.steps) setPipelineSteps(update.steps);
    if (update.currentTask) setCurrentTask(update.currentTask);
    if (update.finalVideoUrl) {
      setFinalVideoUrl(update.finalVideoUrl);
      setJobStatus(JobStatus.FINISHED);
    }
    if (update.numChunks) {
      setNumChunks(update.numChunks);
      // Update scenes based on actual chunk count
      const newScenes = Array.from({ length: update.numChunks }, (_, i) => ({
        id: String(i + 1),
        number: i + 1,
        title: `Scene ${i + 1}`,
        duration: 20,
        status: 'generating' as const,
        prompt: `Scene ${i + 1} content...`,
      }));
      setScenes(newScenes);
    }
    if (update.error) {
      if (update.error.includes("Requested entity was not found.")) {
        setError("API Key not found or invalid. Please select a valid API key.");
        onApiKeyError();
      } else {
        setError(`Generation failed: ${update.error}`);
      }
      setJobStatus(JobStatus.ERROR);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || jobStatus === JobStatus.RUNNING) return;

    resetState();
    setJobStatus(JobStatus.RUNNING);

    const refs = {
      frameExtractionVideoRef: frameExtractionVideoRef.current,
      frameExtractionCanvasRef: frameExtractionCanvasRef.current,
      concatenationVideoRef: concatenationVideoRef.current,
      concatenationCanvasRef: concatenationCanvasRef.current,
    };

    runMovieGenerationPipeline({
      prompt,
      file: uploadedFile,
      numChunks,
      isAutoMode,
      refs,
      onProgress: handleProgressUpdate,
    });
  };

  const isLoading = jobStatus === JobStatus.RUNNING;
  const isActive = jobStatus === JobStatus.RUNNING;

  const panels = [
    { id: 'dashboard' as const, label: 'Orchestration', icon: '🎛️' },
    { id: 'team' as const, label: 'AI Team', icon: '🤖' },
    { id: 'flow' as const, label: 'Data Flow', icon: '🔄' },
    { id: 'composer' as const, label: 'Composer', icon: '🎬' },
    { id: 'analytics' as const, label: 'Analytics', icon: '📊' },
    { id: 'gallery' as const, label: 'Gallery', icon: '🖼️' },
    { id: 'control' as const, label: 'Control', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden processing elements */}
      <video ref={frameExtractionVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={frameExtractionCanvasRef} style={{ display: 'none' }} />
      <video ref={concatenationVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={concatenationCanvasRef} style={{ display: 'none' }} />

      {/* Top Action Bar */}
      <div className="glass-dark border-b border-slate-700/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              AIA Creative Studio
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <span className="text-slate-400">{isActive ? 'Processing' : 'Ready'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Panel selector */}
            <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1">
              {panels.map((panel) => (
                <button
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${activePanel === panel.id
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                    }
                  `}
                >
                  <span className="mr-1">{panel.icon}</span>
                  {panel.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {showSidebar && (
          <div className="w-80 glass-dark border-r border-slate-700/30 overflow-y-auto animate-slide-right">
            <div className="p-4">
              {/* Sidebar tabs */}
              <div className="flex mb-4 bg-slate-800/50 rounded-lg p-1">
                {(['tools', 'settings', 'assets'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarPanel(tab)}
                    className={`
                      flex-1 py-2 rounded-md text-xs font-medium transition-colors
                      ${sidebarPanel === tab
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                      }
                    `}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sidebar content */}
              {sidebarPanel === 'tools' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span>✨</span>
                      AI Models
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                        <span className="text-slate-400">Veo3.1</span>
                        <span className="text-green-400">Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                        <span className="text-slate-400">Seedream 4.0</span>
                        <span className="text-green-400">Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-400">Suno V4</span>
                        <span className="text-green-400">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span>🎨</span>
                      Quick Styles
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cinematic', 'Anime', 'Realistic', 'Artistic'].map((style) => (
                        <button
                          key={style}
                          className="py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-xs text-white transition-colors"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span>🎵</span>
                      Audio Presets
                    </h3>
                    <div className="space-y-2">
                      {['Epic', 'Emotional', 'Upbeat', 'Ambient'].map((preset) => (
                        <button
                          key={preset}
                          className="w-full py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-xs text-left text-white transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {sidebarPanel === 'settings' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h3 className="font-medium text-white mb-3">Generation Settings</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-slate-400 mb-2">Scene Count: {numChunks}</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={numChunks}
                          onChange={(e) => setNumChunks(parseInt(e.target.value))}
                          className="w-full"
                          disabled={isAutoMode}
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isAutoMode}
                          onChange={(e) => setIsAutoMode(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-slate-300">Auto-determine scene count</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {sidebarPanel === 'assets' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <h3 className="font-medium text-white mb-3">Recent Projects</h3>
                    <p className="text-sm text-slate-400">No recent projects</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {!finalVideoUrl && (
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                file={uploadedFile}
                setFile={setUploadedFile}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                numChunks={numChunks}
                setNumChunks={setNumChunks}
                isAutoMode={isAutoMode}
                setIsAutoMode={setIsAutoMode}
              />
            )}

            {finalVideoUrl && (
              <VideoPlayer
                src={finalVideoUrl}
                onReset={() => {
                  resetState();
                  setPrompt('');
                  setUploadedFile(null);
                }}
              />
            )}

            {/* Active Panel */}
            {activePanel === 'dashboard' && (
              <AgentOrchestrationDashboard
                agents={pipelineSteps}
                currentTask={currentTask}
                isActive={isActive}
              />
            )}

            {activePanel === 'team' && (
              <AgentAvatars />
            )}

            {activePanel === 'flow' && (
              <AgentCommunicationFlow activeAgent={currentTask} />
            )}

            {activePanel === 'composer' && (
              <InteractiveSceneComposer scenes={scenes} />
            )}

            {activePanel === 'analytics' && (
              <AgentPerformanceMonitor />
            )}

            {activePanel === 'gallery' && (
              <MultiModalGallery />
            )}

            {activePanel === 'control' && (
              <AgentControlPanel />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-slide-up">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
