import React from 'react';
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
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
      <div className="text-center">
        <h2 className="font-orbitron text-xl font-bold text-cyan-400">Multi-Agent System Status</h2>
        {currentTask && <p className="text-cyan-300 text-sm animate-pulse mt-1">{currentTask}</p>}
      </div>
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
      {error && (
        <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-md text-center">
          <p className="font-bold">Error Encountered</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
