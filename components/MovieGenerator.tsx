import React, { useState, useRef } from 'react';
import { PromptInput } from './PromptInput';
import { StatusDisplay } from './StatusDisplay';
import { VideoPlayer } from './VideoPlayer';
import { runMovieGenerationPipeline } from '../services/backendService';
import type { AgentStep } from '../types';
import { JobStatus } from '../types';
import { PIPELINE_AGENTS } from '../constants';

interface MovieGeneratorProps {
  onApiKeyError: () => void;
}

export const MovieGenerator: React.FC<MovieGeneratorProps> = ({ onApiKeyError }) => {
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
    <div className="space-y-8">
      {/* Hidden elements for processing, used by the backend service */}
      <video ref={frameExtractionVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={frameExtractionCanvasRef} style={{ display: 'none' }} />
      <video ref={concatenationVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />
      <canvas ref={concatenationCanvasRef} style={{ display: 'none' }} />
      
      {finalVideoUrl ? (
        <VideoPlayer src={finalVideoUrl} onReset={() => {
          resetState();
          setPrompt('');
          setUploadedFile(null);
        }} />
      ) : (
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

      {(isLoading || error) && (
        <StatusDisplay steps={pipelineSteps} error={error} currentTask={currentTask} />
      )}
    </div>
  );
};