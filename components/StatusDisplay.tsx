import React, { useState, useEffect } from 'react';
import type { AgentStep } from '../types';
import { PipelineStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, SpinnerIcon } from './icons';

interface StatusDisplayProps {
  steps: AgentStep[];
  error: string | null;
  currentTask: string | null;
}

const getStatusIcon = (status: PipelineStatus) => {
  switch (status) {
    case PipelineStatus.COMPLETED:
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    case PipelineStatus.FAILED:
      return <XCircleIcon className="w-6 h-6 text-red-400" />;
    case PipelineStatus.IN_PROGRESS:
      return <SpinnerIcon className="w-6 h-6 text-cyan-400" />;
    case PipelineStatus.PENDING:
    default:
      return <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-slate-600"></div></div>;
  }
};

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ steps, error, currentTask }) => {
  const [startTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [estimatedTotalTime] = useState<number>(180); // 3 minutes estimate

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === PipelineStatus.COMPLETED).length;
    const pendingSteps = steps.filter(step => step.status === PipelineStatus.PENDING).length;
    const totalSteps = steps.length;
    
    if (totalSteps === 0) return 0;
    
    // Weight completed steps more heavily than pending
    return Math.round(((completedSteps + (pendingSteps * 0.5)) / totalSteps) * 100);
  };

  const getEstimatedTimeRemaining = () => {
    const progress = getProgressPercentage();
    const timeSpent = elapsedTime;
    
    if (progress === 0) return estimatedTotalTime;
    
    const estimatedTotal = (timeSpent / progress) * 100;
    return Math.max(0, estimatedTotal - timeSpent);
  };

  return (
    <div className="glass-dark rounded-2xl border border-slate-700/30 p-6 space-y-6 animate-fade-in">
      {/* Header with progress */}
      <div className="text-center">
        <h2 className="font-orbitron text-xl font-bold text-cyan-400 mb-4">Cinematic Universe Generation</h2>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Time Estimates */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span className="text-slate-400">Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-slate-400">ETA: {formatTime(getEstimatedTimeRemaining())}</span>
          </div>
        </div>

        {currentTask && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <p className="text-cyan-300 text-sm font-medium">Current Task:</p>
            </div>
            <p className="text-slate-200 text-sm mt-1 ml-5">{currentTask}</p>
          </div>
        )}
      </div>

      {/* Steps List */}
      <ul className="space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">{getStatusIcon(step.status)}</div>
            <div>
              <h3 className="font-bold text-slate-200">{step.name}</h3>
              <p className="text-sm text-slate-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md text-center">
          <p className="font-bold">Error Encountered</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
