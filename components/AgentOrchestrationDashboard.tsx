import React, { useState, useEffect } from 'react';
import type { AgentStep } from '../types';
import { PipelineStatus } from '../types';

interface AgentOrchestrationDashboardProps {
  agents: AgentStep[];
  currentTask?: string | null;
  isActive: boolean;
}

export const AgentOrchestrationDashboard: React.FC<AgentOrchestrationDashboardProps> = ({
  agents,
  currentTask,
  isActive
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const [pulseIndex, setPulseIndex] = useState<number>(0);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % agents.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, agents.length]);

  const getStatusColor = (status: PipelineStatus) => {
    switch (status) {
      case PipelineStatus.COMPLETED:
        return 'from-green-500 to-emerald-500';
      case PipelineStatus.IN_PROGRESS:
        return 'from-cyan-500 to-blue-500';
      case PipelineStatus.FAILED:
        return 'from-red-500 to-rose-500';
      default:
        return 'from-slate-600 to-slate-700';
    }
  };

  const getStatusIcon = (status: PipelineStatus) => {
    switch (status) {
      case PipelineStatus.COMPLETED:
        return '✓';
      case PipelineStatus.IN_PROGRESS:
        return '⚡';
      case PipelineStatus.FAILED:
        return '✕';
      default:
        return '○';
    }
  };

  const getAgentRole = (name: string) => {
    if (name.includes('Orchestrator')) return 'System Controller';
    if (name.includes('Story')) return 'Narrative Designer';
    if (name.includes('Scene')) return 'Visual Architect';
    if (name.includes('Frame')) return 'Creative Synthesizer';
    if (name.includes('Audio')) return 'Sound Engineer';
    if (name.includes('Post')) return 'Final Director';
    return 'AI Agent';
  };

  return (
    <div className="glass-dark rounded-2xl p-8 border border-cyan-500/20 shadow-glow-cyan">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-orbitron text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              Multi-Agent Orchestration System
            </h3>
            <p className="text-slate-400 text-sm mt-1">6 Specialized AI Agents Working in Harmony</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="text-sm text-slate-300">{isActive ? 'Active' : 'Idle'}</span>
          </div>
        </div>

        {currentTask && (
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-4 animate-slide-up">
            <p className="text-cyan-300 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {currentTask}
            </p>
          </div>
        )}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isHovered = hoveredAgent === index;
          const shouldPulse = pulseIndex === index && agent.status === PipelineStatus.IN_PROGRESS;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredAgent(index)}
              onMouseLeave={() => setHoveredAgent(null)}
              className={`
                relative group
                bg-gradient-to-br from-slate-800/50 to-slate-900/50
                border-2 rounded-xl p-6
                transition-all duration-500
                ${agent.status === PipelineStatus.IN_PROGRESS ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'border-slate-700/30'}
                ${isHovered ? 'scale-105 -translate-y-1' : ''}
                ${shouldPulse ? 'animate-pulse' : ''}
              `}
            >
              {/* Status indicator */}
              <div className="absolute top-4 right-4">
                <div className={`
                  w-8 h-8 rounded-full
                  bg-gradient-to-br ${getStatusColor(agent.status)}
                  flex items-center justify-center
                  text-white font-bold text-sm
                  ${agent.status === PipelineStatus.IN_PROGRESS ? 'animate-pulse' : ''}
                `}>
                  {getStatusIcon(agent.status)}
                </div>
              </div>

              {/* Agent icon */}
              <div className={`
                w-16 h-16 rounded-full mb-4
                bg-gradient-to-br ${getStatusColor(agent.status)}
                flex items-center justify-center
                transition-transform duration-300
                ${isHovered ? 'scale-110 rotate-12' : ''}
              `}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              {/* Agent info */}
              <div className="space-y-2">
                <h4 className="font-orbitron font-bold text-lg text-white">
                  {agent.name.replace(' Agent', '')}
                </h4>
                <p className="text-xs text-cyan-400 font-medium">
                  {getAgentRole(agent.name)}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              {/* Progress bar for active agents */}
              {agent.status === PipelineStatus.IN_PROGRESS && (
                <div className="mt-4 space-y-2">
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-progress"></div>
                  </div>
                  <p className="text-xs text-cyan-400">Processing...</p>
                </div>
              )}

              {/* Completion indicator */}
              {agent.status === PipelineStatus.COMPLETED && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Complete</span>
                </div>
              )}

              {/* Connection lines (for visual flow) */}
              {index < agents.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* System Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">
            {agents.filter(a => a.status === PipelineStatus.COMPLETED).length}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Active</p>
          <p className="text-2xl font-bold text-cyan-400">
            {agents.filter(a => a.status === PipelineStatus.IN_PROGRESS).length}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Pending</p>
          <p className="text-2xl font-bold text-slate-400">
            {agents.filter(a => a.status === PipelineStatus.PENDING).length}
          </p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">System Load</p>
          <p className="text-2xl font-bold text-purple-400">
            {Math.round((agents.filter(a => a.status === PipelineStatus.COMPLETED).length / agents.length) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};
