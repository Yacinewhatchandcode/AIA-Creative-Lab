import React, { useState, useEffect } from 'react';

interface DataFlowNode {
  id: string;
  label: string;
  type: 'input' | 'agent' | 'output';
  status: 'idle' | 'active' | 'complete';
  position: { x: number; y: number };
}

interface DataFlowConnection {
  from: string;
  to: string;
  label: string;
  active: boolean;
}

interface AgentCommunicationFlowProps {
  activeAgent?: string | null;
}

export const AgentCommunicationFlow: React.FC<AgentCommunicationFlowProps> = ({ activeAgent }) => {
  const [nodes] = useState<DataFlowNode[]>([
    { id: 'input', label: 'User Prompt', type: 'input', status: 'complete', position: { x: 50, y: 200 } },
    { id: 'orchestrator', label: 'Orchestrator', type: 'agent', status: 'idle', position: { x: 200, y: 100 } },
    { id: 'story', label: 'Story Analysis', type: 'agent', status: 'idle', position: { x: 200, y: 300 } },
    { id: 'scene', label: 'Scene Setup', type: 'agent', status: 'idle', position: { x: 400, y: 200 } },
    { id: 'frame', label: 'Frame Agent', type: 'agent', status: 'idle', position: { x: 600, y: 150 } },
    { id: 'audio', label: 'Audio Synthesis', type: 'agent', status: 'idle', position: { x: 600, y: 250 } },
    { id: 'post', label: 'Post-Production', type: 'agent', status: 'idle', position: { x: 800, y: 200 } },
    { id: 'output', label: 'Final Movie', type: 'output', status: 'idle', position: { x: 950, y: 200 } },
  ]);

  const [connections] = useState<DataFlowConnection[]>([
    { from: 'input', to: 'orchestrator', label: 'Raw Input', active: false },
    { from: 'input', to: 'story', label: 'Content', active: false },
    { from: 'orchestrator', to: 'scene', label: 'Config', active: false },
    { from: 'story', to: 'scene', label: 'Scenes', active: false },
    { from: 'scene', to: 'frame', label: 'Keyframes', active: false },
    { from: 'scene', to: 'audio', label: 'Script', active: false },
    { from: 'frame', to: 'post', label: 'Video Chunks', active: false },
    { from: 'audio', to: 'post', label: 'Audio Tracks', active: false },
    { from: 'post', to: 'output', label: 'Rendered', active: false },
  ]);

  const [animatingConnections, setAnimatingConnections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * connections.length);
      const connKey = `${connections[randomIndex].from}-${connections[randomIndex].to}`;
      
      setAnimatingConnections(prev => {
        const next = new Set(prev);
        next.add(connKey);
        setTimeout(() => {
          setAnimatingConnections(p => {
            const n = new Set(p);
            n.delete(connKey);
            return n;
          });
        }, 2000);
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [connections]);

  const getNodeColor = (node: DataFlowNode) => {
    if (node.type === 'input') return 'from-purple-500 to-pink-500';
    if (node.type === 'output') return 'from-green-500 to-emerald-500';
    if (node.status === 'active') return 'from-cyan-500 to-blue-500';
    if (node.status === 'complete') return 'from-green-500 to-teal-500';
    return 'from-slate-600 to-slate-700';
  };

  return (
    <div className="glass-dark rounded-2xl p-6 border border-purple-500/20 shadow-glow-purple overflow-hidden">
      <div className="mb-6">
        <h3 className="font-orbitron text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          Agent Communication Flow
        </h3>
        <p className="text-slate-400 text-sm">Real-time data flow between AI agents</p>
      </div>

      {/* Flow visualization canvas */}
      <div className="relative w-full h-96 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Connection lines */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const connKey = `${conn.from}-${conn.to}`;
            const isAnimating = animatingConnections.has(connKey);

            return (
              <g key={index}>
                <line
                  x1={fromNode.position.x + 40}
                  y1={fromNode.position.y + 20}
                  x2={toNode.position.x}
                  y2={toNode.position.y + 20}
                  stroke="url(#lineGradient)"
                  strokeWidth={isAnimating ? "3" : "2"}
                  filter={isAnimating ? "url(#glow)" : undefined}
                  className={isAnimating ? "animate-pulse" : ""}
                />
                {/* Data packet animation */}
                {isAnimating && (
                  <circle
                    cx={fromNode.position.x + 40}
                    cy={fromNode.position.y + 20}
                    r="4"
                    fill="#06b6d4"
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="cx"
                      from={fromNode.position.x + 40}
                      to={toNode.position.x}
                      dur="2s"
                      repeatCount="1"
                    />
                    <animate
                      attributeName="cy"
                      from={fromNode.position.y + 20}
                      to={toNode.position.y + 20}
                      dur="2s"
                      repeatCount="1"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, index) => (
          <div
            key={index}
            className="absolute transition-all duration-500"
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              zIndex: 10
            }}
          >
            <div className={`
              group relative
              w-32 h-12
              bg-gradient-to-r ${getNodeColor(node)}
              rounded-lg
              flex items-center justify-center
              cursor-pointer
              transition-transform duration-300
              hover:scale-110
              ${node.status === 'active' ? 'animate-pulse' : ''}
            `}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-50 blur transition-opacity"></div>
              <div className="relative text-white text-xs font-medium text-center px-2">
                {node.label}
              </div>
              
              {node.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
              )}
              {node.status === 'complete' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
              )}
            </div>
          </div>
        ))}

        {/* Animated particles in background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <span className="text-slate-300">Input</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <span className="text-slate-300">Active Agent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></div>
          <span className="text-slate-300">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
          <span className="text-slate-300">Output</span>
        </div>
      </div>
    </div>
  );
};
