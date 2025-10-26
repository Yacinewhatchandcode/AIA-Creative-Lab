import React, { useState, useRef, useEffect } from 'react';
import { PromptInput } from './PromptInput';
import { StatusDisplay } from './StatusDisplay';
import { VideoPlayer } from './VideoPlayer';
import { runMovieGenerationPipeline } from '../services/backendService';
import type { AgentStep } from '../types';
import { JobStatus } from '../types';
import { PIPELINE_AGENTS } from '../constants';
import { preferences } from '../utils/preferences';

interface MovieGeneratorProps {
  onApiKeyError: () => void;
}

export const MovieGenerator: React.FC<MovieGeneratorProps> = ({ onApiKeyError }) => {
  // Load preferences on mount
  useEffect(() => {
    const savedSceneCount = preferences.getDefaultSceneCount();
    const savedAutoMode = preferences.isAutoMode();
    
    setNumChunks(savedSceneCount);
    setIsAutoMode(savedAutoMode);
  }, []);

  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>(JobStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<AgentStep[]>(PIPELINE_AGENTS);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [numChunks, setNumChunks] = useState<number>(3);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  
  // Advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [videoModel, setVideoModel] = useState<'veo3' | 'veo3_fast'>('veo3_fast');
  const [enableParallel, setEnableParallel] = useState<boolean>(false);
  const [customSeed, setCustomSeed] = useState<number>(0);
  
  const frameExtractionVideoRef = useRef<HTMLVideoElement>(null);
  const frameExtractionCanvasRef = useRef<HTMLCanvasElement>(null);
  const concatenationVideoRef = useRef<HTMLVideoElement>(null);
  const concatenationCanvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hidden elements for processing, used by the backend service */}
      <video ref={frameExtractionVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={frameExtractionCanvasRef} style={{ display: 'none' }} />
      <video ref={concatenationVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={concatenationCanvasRef} style={{ display: 'none' }} />
      
      {finalVideoUrl ? (
        <div className="animate-fade-in">
          <VideoPlayer src={finalVideoUrl} onReset={() => {
            resetState();
            setPrompt('');
            setUploadedFile(null);
          }} />
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          {/* Hero Section */}
          <div className="text-center mb-12 relative glass-dark rounded-2xl p-8 border border-cyan-500/20 shadow-glow-cyan">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl rounded-2xl"></div>
            <h2 className="font-orbitron text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 relative animate-gradient">
              Cinematic Universe Generator
            </h2>
            <p className="text-slate-300 text-lg max-w-3xl mx-auto relative">
              Transform your ideas into stunning cinematic experiences with AI-powered video generation powered by Veo3.1
            </p>
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mt-6 relative">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium border border-cyan-500/30">
                Powered by Veo3.1
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                Autonomous Frame Generation
              </span>
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-medium border border-pink-500/30">
                Real-time Processing
              </span>
            </div>
          </div>
          
          {/* Advanced Settings Panel */}
          <div className="glass-dark rounded-2xl border border-slate-700/30 animate-fade-in">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 rounded-t-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 text-cyan-400 transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-cyan-400">Advanced Settings</span>
              </div>
              <span className="text-xs text-slate-400">Customize your generation</span>
            </button>
            
            {showAdvancedSettings && (
              <div className="p-4 space-y-4 border-t border-slate-700/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Video Model */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Video Model</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-colors">
                        <input
                          type="radio"
                          name="videoModel"
                          value="veo3_fast"
                          checked={videoModel === 'veo3_fast'}
                          onChange={(e) => setVideoModel(e.target.value as 'veo3' | 'veo3_fast')}
                          className="w-4 h-4 text-cyan-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Veo3 Fast</div>
                          <div className="text-xs text-slate-400">Quick generation (recommended)</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-colors">
                        <input
                          type="radio"
                          name="videoModel"
                          value="veo3"
                          checked={videoModel === 'veo3'}
                          onChange={(e) => setVideoModel(e.target.value as 'veo3' | 'veo3_fast')}
                          className="w-4 h-4 text-cyan-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-white">Veo3 Pro</div>
                          <div className="text-xs text-slate-400">Higher quality, longer processing</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    >
                      <option value="16:9">Widescreen (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>

                  {/* Custom Seed */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Custom Seed (Optional)</label>
                    <input
                      type="number"
                      value={customSeed}
                      onChange={(e) => setCustomSeed(parseInt(e.target.value) || 0)}
                      placeholder="0 for random"
                      className="w-full p-3 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Use the same seed to generate similar results</p>
                  </div>

                  {/* Parallel Processing */}
                  <div>
                    <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <input
                        type="checkbox"
                        checked={enableParallel}
                        onChange={(e) => setEnableParallel(e.target.checked)}
                        className="w-4 h-4 text-cyan-500 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">Enable Parallel Processing</div>
                        <div className="text-xs text-slate-400">Generate multiple scenes simultaneously</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-4 border-t border-slate-700/30">
                  <button
                    onClick={() => setShowAdvancedSettings(false)}
                    className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Apply Settings
                  </button>
                </div>
              </div>
            )}
          </div>

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
          
          {(isLoading || error) && (
            <div className="animate-slide-up">
              <StatusDisplay steps={pipelineSteps} error={error} currentTask={currentTask} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};