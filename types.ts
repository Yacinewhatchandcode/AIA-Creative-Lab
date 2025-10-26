import type React from 'react';

export enum PipelineStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
  FAILED,
}

export enum JobStatus {
  IDLE,
  RUNNING,
  FINISHED,
  ERROR,
}

export interface AgentStep {
  name: string;
  status: PipelineStatus;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Fix: To resolve a "Subsequent property declarations must have the same type" error,
// AIStudio is defined in the global scope. This ensures that there's only one
// definition of the AIStudio type across the entire project.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
