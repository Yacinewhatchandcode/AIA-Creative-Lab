import React from 'react';
import { FilmIcon, WandIcon, ChatBubbleIcon, MicrophoneIcon } from './icons';

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
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-cyan-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
    >
        <Icon className="w-5 h-5" />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => (
    <header className="border-b-2 border-cyan-500/30 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className='text-center sm:text-left'>
                <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-cyan-400 tracking-wider">
                    AI CREATIVE SUITE
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                    A Multi-Modal Generation Platform
                </p>
            </div>
            <nav className="flex space-x-2 p-1 bg-slate-900 rounded-lg border border-slate-700">
                <NavButton
                    isActive={activeTab === 'movie'}
                    onClick={() => setActiveTab('movie')}
                    icon={FilmIcon}
                    label="Movie Generator"
                />
                <NavButton
                    isActive={activeTab === 'image'}
                    onClick={() => setActiveTab('image')}
                    icon={WandIcon}
                    label="Image Studio"
                />
                <NavButton
                    isActive={activeTab === 'chat'}
                    onClick={() => setActiveTab('chat')}
                    icon={ChatBubbleIcon}
                    label="AI Chatbot"
                />
                 <NavButton
                    isActive={activeTab === 'live'}
                    onClick={() => setActiveTab('live')}
                    icon={MicrophoneIcon}
                    label="Live Chat"
                />
            </nav>
        </div>
    </header>
);