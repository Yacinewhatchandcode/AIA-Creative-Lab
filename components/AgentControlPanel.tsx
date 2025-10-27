import React, { useState } from 'react';

interface AgentConfig {
  name: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  model?: string;
  customParams?: Record<string, any>;
}

export const AgentControlPanel: React.FC = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([
    {
      name: 'Orchestrator Agent',
      enabled: true,
      priority: 'high',
      maxConcurrent: 1,
      timeout: 30,
      retryAttempts: 3,
    },
    {
      name: 'Story Analysis Agent',
      enabled: true,
      priority: 'high',
      maxConcurrent: 2,
      timeout: 60,
      retryAttempts: 2,
      model: 'Gemini Pro',
    },
    {
      name: 'Scene Setup Agent',
      enabled: true,
      priority: 'medium',
      maxConcurrent: 3,
      timeout: 120,
      retryAttempts: 2,
    },
    {
      name: 'Autonomous Frame Agent',
      enabled: true,
      priority: 'high',
      maxConcurrent: 5,
      timeout: 600,
      retryAttempts: 3,
      model: 'Seedream 4.0 + Veo3',
      customParams: {
        parallelProcessing: true,
        qualityMode: 'balanced',
      },
    },
    {
      name: 'Audio Synthesis Agent',
      enabled: true,
      priority: 'medium',
      maxConcurrent: 3,
      timeout: 180,
      retryAttempts: 2,
      model: 'Suno V4',
    },
    {
      name: 'Post-Production Agent',
      enabled: true,
      priority: 'high',
      maxConcurrent: 1,
      timeout: 300,
      retryAttempts: 2,
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(agents[3]); // Frame agent by default
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleAgent = (index: number) => {
    const newAgents = [...agents];
    newAgents[index].enabled = !newAgents[index].enabled;
    setAgents(newAgents);
  };

  const handleUpdateAgent = (index: number, updates: Partial<AgentConfig>) => {
    const newAgents = [...agents];
    newAgents[index] = { ...newAgents[index], ...updates };
    setAgents(newAgents);
    if (selectedAgent && selectedAgent.name === newAgents[index].name) {
      setSelectedAgent(newAgents[index]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="glass-dark rounded-2xl p-6 border border-purple-500/20">
      <div className="mb-6">
        <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          Agent Control Center
        </h3>
        <p className="text-slate-400 text-sm">Configure and manage individual AI agents</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Agent list */}
        <div className="space-y-3">
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <span>Active Agents</span>
            <span className="text-xs text-cyan-400">({agents.filter(a => a.enabled).length}/{agents.length})</span>
          </h4>
          
          {agents.map((agent, index) => (
            <div
              key={index}
              onClick={() => setSelectedAgent(agent)}
              className={`
                p-4 rounded-xl cursor-pointer transition-all
                ${selectedAgent?.name === agent.name
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                  : 'bg-slate-800/30 border-2 border-slate-700/30 hover:border-purple-500/30'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAgent(index);
                      }}
                      className={`
                        w-10 h-6 rounded-full transition-colors relative
                        ${agent.enabled ? 'bg-green-500' : 'bg-slate-600'}
                      `}
                    >
                      <div className={`
                        absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${agent.enabled ? 'translate-x-5' : 'translate-x-1'}
                      `}></div>
                    </button>
                    <h5 className="font-medium text-white text-sm">{agent.name.replace(' Agent', '')}</h5>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(agent.priority)}`}>
                      {agent.priority.toUpperCase()}
                    </span>
                    {agent.model && (
                      <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {agent.model}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Agent configuration */}
        <div className="space-y-4">
          {selectedAgent ? (
            <>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h4 className="font-orbitron font-bold text-white mb-4">{selectedAgent.name}</h4>
                
                <div className="space-y-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Priority Level</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => {
                            const index = agents.findIndex(a => a.name === selectedAgent.name);
                            handleUpdateAgent(index, { priority });
                          }}
                          className={`
                            flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors
                            ${selectedAgent.priority === priority
                              ? `${getPriorityColor(priority)} border`
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }
                          `}
                        >
                          {priority.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max concurrent */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">
                      Max Concurrent Tasks: {selectedAgent.maxConcurrent}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedAgent.maxConcurrent}
                      onChange={(e) => {
                        const index = agents.findIndex(a => a.name === selectedAgent.name);
                        handleUpdateAgent(index, { maxConcurrent: parseInt(e.target.value) });
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Timeout */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={selectedAgent.timeout}
                      onChange={(e) => {
                        const index = agents.findIndex(a => a.name === selectedAgent.name);
                        handleUpdateAgent(index, { timeout: parseInt(e.target.value) });
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Retry attempts */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Retry Attempts</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={selectedAgent.retryAttempts}
                      onChange={(e) => {
                        const index = agents.findIndex(a => a.name === selectedAgent.name);
                        handleUpdateAgent(index, { retryAttempts: parseInt(e.target.value) });
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Model info */}
                  {selectedAgent.model && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">AI Model</label>
                      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-sm text-cyan-400">{selectedAgent.model}</p>
                      </div>
                    </div>
                  )}

                  {/* Advanced settings */}
                  {selectedAgent.customParams && (
                    <div>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                      >
                        <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Advanced Parameters
                      </button>
                      
                      {showAdvanced && (
                        <div className="mt-3 space-y-2 animate-slide-up">
                          {Object.entries(selectedAgent.customParams).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{key}:</span>
                              <span className="text-cyan-400">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Save Configuration
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                  Reset
                </button>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700/30 text-center">
              <p className="text-slate-400">Select an agent to configure</p>
            </div>
          )}
        </div>
      </div>

      {/* System actions */}
      <div className="mt-6 pt-6 border-t border-slate-700/30 flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-500/30">
          ✓ Apply All Changes
        </button>
        <button className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-500/30">
          ⟲ Restart All Agents
        </button>
        <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors border border-purple-500/30">
          ⚙ Export Config
        </button>
        <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-sm font-medium transition-colors">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
