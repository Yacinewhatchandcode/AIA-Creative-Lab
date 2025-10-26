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