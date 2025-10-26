import React, { useState } from 'react';
import { FilmIcon, WandIcon, ChatBubbleIcon, MicrophoneIcon } from './icons';
import { HistoryGallery } from './HistoryGallery';

type ActiveTab = 'movie' | 'image' | 'chat' | 'live';

interface HeaderProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}> = ({ isActive, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            isActive
                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/30 transform scale-105'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'
        }`}
    >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{label}</span>
        {/* Active indicator */}
        {isActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 animate-pulse"></div>
        )}
    </button>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
    const [showHistory, setShowHistory] = useState(false);
    
    return (
        <>
            <header className="relative pb-6 animate-slide-up">
                {/* Gradient underline */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-center sm:text-left">
                        <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider animate-gradient">
                            AI CREATIVE SUITE
                        </h1>
                        <p className="mt-2 text-sm text-slate-400 font-light">
                            A Multi-Modal Generation Platform
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* History Button */}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-3 glass-dark rounded-xl border border-slate-600/30 text-cyan-400 hover:text-cyan-300 transition-all duration-300 transform hover:scale-105"
                            title="View History"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        
                        {/* Navigation */}
                        <nav className="glass-dark rounded-xl p-2 shadow-glow-cyan animate-fade-in">
                            <div className="flex flex-wrap justify-center sm:justify-start sm:flex-nowrap gap-1">
                                <NavButton
                                    isActive={activeTab === 'movie'}
                                    onClick={() => setActiveTab('movie')}
                                    icon={FilmIcon}
                                    label="Movie"
                                />
                                <NavButton
                                    isActive={activeTab === 'image'}
                                    onClick={() => setActiveTab('image')}
                                    icon={WandIcon}
                                    label="Image"
                                />
                                <NavButton
                                    isActive={activeTab === 'chat'}
                                    onClick={() => setActiveTab('chat')}
                                    icon={ChatBubbleIcon}
                                    label="Chat"
                                />
                                 <NavButton
                                    isActive={activeTab === 'live'}
                                    onClick={() => setActiveTab('live')}
                                    icon={MicrophoneIcon}
                                    label="Live"
                                />
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* History Gallery */}
            <HistoryGallery
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                type={activeTab === 'movie' ? 'movie' : activeTab === 'image' ? 'image' : 'all'}
            />
        </>
    );
};