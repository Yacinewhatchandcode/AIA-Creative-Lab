import React, { useState, useEffect } from 'react';

interface AgentMetrics {
  name: string;
  tasksCompleted: number;
  avgProcessingTime: number;
  successRate: number;
  currentLoad: number;
}

export const AgentPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([
    { name: 'Orchestrator', tasksCompleted: 127, avgProcessingTime: 0.5, successRate: 100, currentLoad: 15 },
    { name: 'Story Analysis', tasksCompleted: 98, avgProcessingTime: 2.3, successRate: 98, currentLoad: 45 },
    { name: 'Scene Setup', tasksCompleted: 234, avgProcessingTime: 1.8, successRate: 99, currentLoad: 62 },
    { name: 'Frame Agent', tasksCompleted: 456, avgProcessingTime: 8.5, successRate: 96, currentLoad: 78 },
    { name: 'Audio Synthesis', tasksCompleted: 189, avgProcessingTime: 6.2, successRate: 97, currentLoad: 55 },
    { name: 'Post-Production', tasksCompleted: 91, avgProcessingTime: 4.1, successRate: 99, currentLoad: 33 },
  ]);

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'tasks' | 'time' | 'success' | 'load'>('load');

  const getLoadColor = (load: number) => {
    if (load > 80) return 'text-red-400';
    if (load > 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getLoadBarColor = (load: number) => {
    if (load > 80) return 'from-red-500 to-orange-500';
    if (load > 50) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="glass-dark rounded-2xl p-6 border border-cyan-500/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
            Agent Performance Analytics
          </h3>
          <p className="text-slate-400 text-sm">Real-time monitoring and performance metrics</p>
        </div>

        {/* Time range selector */}
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${timeRange === range 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        {[
          { key: 'tasks', label: 'Tasks', icon: '✓' },
          { key: 'time', label: 'Speed', icon: '⚡' },
          { key: 'success', label: 'Success', icon: '★' },
          { key: 'load', label: 'Load', icon: '◆' },
        ].map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetric(metric.key as typeof selectedMetric)}
            className={`
              p-3 rounded-xl transition-all
              ${selectedMetric === metric.key
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
              }
            `}
          >
            <div className="text-2xl mb-1">{metric.icon}</div>
            <div className="text-xs font-medium">{metric.label}</div>
          </button>
        ))}
      </div>

      {/* Agents list with metrics */}
      <div className="space-y-4">
        {metrics.map((agent, index) => (
          <div
            key={index}
            className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-orbitron font-bold text-white">{agent.name}</h4>
                  <span className={`text-xs font-medium ${getLoadColor(agent.currentLoad)}`}>
                    {agent.currentLoad}% Load
                  </span>
                </div>
                
                {/* Load bar */}
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getLoadBarColor(agent.currentLoad)} transition-all duration-500`}
                    style={{ width: `${agent.currentLoad}%` }}
                  ></div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Tasks</p>
                <p className="text-cyan-400 font-bold text-lg">{agent.tasksCompleted}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Avg Time</p>
                <p className="text-purple-400 font-bold text-lg">{agent.avgProcessingTime}s</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Success</p>
                <p className="text-green-400 font-bold text-lg">{agent.successRate}%</p>
              </div>
            </div>

            {/* Mini performance chart */}
            <div className="mt-4 flex items-end gap-1 h-16">
              {[...Array(24)].map((_, i) => {
                const height = 30 + Math.random() * 70;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-500/20 rounded-t group-hover:from-cyan-500/70 group-hover:to-cyan-500/30 transition-all"
                    style={{ height: `${height}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-cyan-400">
            {metrics.reduce((sum, m) => sum + m.tasksCompleted, 0)}
          </p>
          <p className="text-xs text-green-400 mt-1">↑ 12% vs yesterday</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Avg Speed</p>
          <p className="text-2xl font-bold text-purple-400">
            {(metrics.reduce((sum, m) => sum + m.avgProcessingTime, 0) / metrics.length).toFixed(1)}s
          </p>
          <p className="text-xs text-green-400 mt-1">↓ 8% faster</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-400">
            {(metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length).toFixed(0)}%
          </p>
          <p className="text-xs text-green-400 mt-1">↑ 1.2%</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-400 text-xs mb-1">System Load</p>
          <p className="text-2xl font-bold text-yellow-400">
            {(metrics.reduce((sum, m) => sum + m.currentLoad, 0) / metrics.length).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Optimal</p>
        </div>
      </div>
    </div>
  );
};
