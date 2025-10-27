import React, { useState, useEffect } from 'react';

interface AgentAvatar {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'working' | 'complete' | 'error';
  color: string;
  personality: string;
  currentAction?: string;
  efficiency: number;
}

interface AgentAvatarsProps {
  agents?: AgentAvatar[];
  compact?: boolean;
}

const DEFAULT_AGENTS: AgentAvatar[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'System Director',
    status: 'idle',
    color: 'from-cyan-500 to-blue-500',
    personality: 'Strategic and commanding',
    efficiency: 100,
  },
  {
    id: 'story',
    name: 'Story Analyst',
    role: 'Narrative Designer',
    status: 'idle',
    color: 'from-purple-500 to-pink-500',
    personality: 'Creative and insightful',
    efficiency: 98,
  },
  {
    id: 'scene',
    name: 'Scene Architect',
    role: 'Visual Director',
    status: 'idle',
    color: 'from-green-500 to-teal-500',
    personality: 'Meticulous and artistic',
    efficiency: 99,
  },
  {
    id: 'frame',
    name: 'Frame Master',
    role: 'Creative Synthesizer',
    status: 'idle',
    color: 'from-orange-500 to-red-500',
    personality: 'Innovative and powerful',
    efficiency: 96,
  },
  {
    id: 'audio',
    name: 'Sound Engineer',
    role: 'Audio Composer',
    status: 'idle',
    color: 'from-indigo-500 to-purple-500',
    personality: 'Harmonious and precise',
    efficiency: 97,
  },
  {
    id: 'post',
    name: 'Final Director',
    role: 'Post Producer',
    status: 'idle',
    color: 'from-yellow-500 to-orange-500',
    personality: 'Polished and perfectionist',
    efficiency: 99,
  },
];

export const AgentAvatars: React.FC<AgentAvatarsProps> = ({ 
  agents = DEFAULT_AGENTS, 
  compact = false 
}) => {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      setActiveAgents(prev => {
        const next = new Set(prev);
        if (next.has(randomAgent.id)) {
          next.delete(randomAgent.id);
        } else {
          next.add(randomAgent.id);
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [agents]);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'thinking': return '🤔';
      case 'working': return '⚡';
      case 'complete': return '✓';
      case 'error': return '⚠️';
      default: return '○';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
        <span className="text-xs text-slate-400 font-medium">Agents:</span>
        <div className="flex -space-x-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`
                w-10 h-10 rounded-full border-2 border-slate-900
                bg-gradient-to-br ${agent.color}
                flex items-center justify-center
                transition-all duration-300
                hover:scale-125 hover:z-10
                cursor-pointer
                ${activeAgents.has(agent.id) ? 'animate-pulse ring-2 ring-cyan-400' : ''}
              `}
              title={agent.name}
            >
              <span className="text-white text-xs font-bold">
                {agent.name.charAt(0)}
              </span>
            </div>
          ))}
        </div>
        <div className="ml-2 text-xs text-green-400">
          {agents.filter(a => activeAgents.has(a.id)).length}/{agents.length} active
        </div>
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-2xl p-6 border border-purple-500/20">
      <div className="mb-6">
        <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          AI Agent Team
        </h3>
        <p className="text-slate-400 text-sm">Your specialized AI workforce</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {agents.map((agent, index) => {
          const isHovered = hoveredAgent === agent.id;
          const isActive = activeAgents.has(agent.id);

          return (
            <div
              key={agent.id}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              className="relative group"
            >
              {isActive && (
                <div className={`
                  absolute inset-0 rounded-2xl
                  bg-gradient-to-br ${agent.color}
                  opacity-20 blur-xl
                  animate-pulse
                `}></div>
              )}

              <div className={`
                relative
                bg-gradient-to-br from-slate-800/50 to-slate-900/50
                rounded-2xl p-6
                border-2 transition-all duration-500
                ${isActive 
                  ? `border-cyan-500/50 shadow-lg shadow-cyan-500/20` 
                  : 'border-slate-700/30'
                }
                ${isHovered ? 'scale-105 -translate-y-2' : ''}
              `}>
                <div className="relative mb-4">
                  <div className={`
                    w-24 h-24 mx-auto rounded-full
                    bg-gradient-to-br ${agent.color}
                    flex items-center justify-center
                    transition-transform duration-500
                    ${isHovered ? 'scale-110 rotate-6' : ''}
                    ${isActive ? 'animate-pulse' : ''}
                  `}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center">
                      <div className="text-4xl font-bold text-white drop-shadow-lg">
                        {agent.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-cyan-400">
                      <span className="text-sm">{getStatusEmoji(agent.status)}</span>
                    </div>

                    {isActive && (
                      <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h4 className="font-orbitron font-bold text-white text-lg">
                    {agent.name}
                  </h4>
                  <p className="text-xs text-purple-400 font-medium">
                    {agent.role}
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    "{agent.personality}"
                  </p>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Efficiency</span>
                      <span className="text-cyan-400 font-bold">{agent.efficiency}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${agent.color} transition-all duration-500`}
                        style={{ width: `${agent.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {isHovered && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <p className="text-2xl font-bold text-green-400">
            {agents.filter(a => activeAgents.has(a.id)).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Active Now</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <p className="text-2xl font-bold text-cyan-400">
            {Math.round(agents.reduce((sum, a) => sum + a.efficiency, 0) / agents.length)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">Avg Efficiency</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <p className="text-2xl font-bold text-purple-400">
            {agents.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Team Size</p>
        </div>
      </div>
    </div>
  );
};
