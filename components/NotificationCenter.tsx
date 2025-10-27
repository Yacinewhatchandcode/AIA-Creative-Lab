import React, { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'agent';
  title: string;
  message: string;
  timestamp: Date;
  agentName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  read: boolean;
}

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'System Initialized',
      message: 'All 6 AI agents are ready and waiting for tasks',
      timestamp: new Date(Date.now() - 120000),
      read: true,
    },
    {
      id: '2',
      type: 'agent',
      title: 'Frame Agent Active',
      message: 'Started parallel processing of 3 scenes',
      agentName: 'Frame Master',
      timestamp: new Date(Date.now() - 60000),
      read: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Performance Optimal',
      message: 'All agents operating at 98% efficiency',
      timestamp: new Date(Date.now() - 30000),
      read: false,
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'agent'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Simulate receiving notifications
    const interval = setInterval(() => {
      const agentNotifications = [
        { agent: 'Story Analyst', message: 'Completed scene analysis and breakdown' },
        { agent: 'Frame Master', message: 'Generated enhanced frame with Seedream 4.0' },
        { agent: 'Sound Engineer', message: 'Composed custom soundtrack for scene 2' },
        { agent: 'Orchestrator', message: 'Optimized pipeline for faster processing' },
        { agent: 'Scene Architect', message: 'Maintained visual continuity across scenes' },
        { agent: 'Final Director', message: 'Successfully merged all video chunks' },
      ];

      const random = agentNotifications[Math.floor(Math.random() * agentNotifications.length)];
      
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'agent',
        title: `${random.agent} Update`,
        message: random.message,
        agentName: random.agent,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    }, 15000); // New notification every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'agent':
        return '🤖';
      default:
        return 'ℹ';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'agent':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'agent') return n.type === 'agent';
    return true;
  });

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 glass-dark rounded-xl border border-slate-600/30 hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105"
        title="Notifications"
      >
        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
              {unreadCount}
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></div>
          </>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="absolute right-0 top-16 w-96 max-h-[600px] glass-dark rounded-2xl border border-slate-700/50 shadow-2xl z-50 animate-slide-down overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Notifications
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2">
                {(['all', 'unread', 'agent'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`
                      flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors
                      ${filterType === type
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                      }
                    `}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    {type === 'unread' && unreadCount > 0 && (
                      <span className="ml-1">({unreadCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-700/50 flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Mark all read
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[450px] custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        markAsRead(notification.id);
                        onNotificationClick?.(notification);
                      }}
                      className={`
                        p-4 cursor-pointer transition-colors
                        hover:bg-slate-800/50
                        ${!notification.read ? 'bg-slate-800/30' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-sm border
                          ${getTypeColor(notification.type)}
                        `}>
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-white text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                          
                          {notification.agentName && (
                            <p className="text-xs text-cyan-400 mt-0.5">
                              {notification.agentName}
                            </p>
                          )}
                          
                          <p className="text-sm text-slate-300 mt-1">
                            {notification.message}
                          </p>
                          
                          <p className="text-xs text-slate-500 mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>

                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                              }}
                              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                            >
                              {notification.action.label} →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
