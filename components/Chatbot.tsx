import React, { useState, useEffect, useRef } from 'react';
import { realChatService, ChatSession } from '../services/realChatService';
import { SparklesIcon } from './icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef<ChatSession | null>(null);

    useEffect(() => {
        // Initialize real chat session
        const session = realChatService.startChat();
        chatSessionRef.current = session;
        const history = session.getHistory();
        
        setMessages(history.map(msg => ({
            sender: msg.role as 'user' | 'ai',
            text: msg.content
        })));
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chatSessionRef.current) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        // Add a placeholder for the AI response
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

        try {
            const responseText = await chatSessionRef.current.sendMessageStream(
                currentInput,
                (chunk) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        newMessages[newMessages.length - 1] = { 
                            sender: 'ai', 
                            text: lastMessage.text + chunk
                        };
                        return newMessages;
                    });
                }
            );
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { 
                    sender: 'ai', 
                    text: 'Sorry, I encountered an error processing your message. Please try again.' 
                };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] glass-dark rounded-2xl border border-slate-700/50 shadow-glow-cyan animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700/30">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-400 rounded-full animate-pulse blur-md"></div>
                        <div className="relative w-3 h-3 bg-cyan-400 rounded-full"></div>
                    </div>
                    <h3 className="font-orbitron text-xl font-semibold text-cyan-400">AI Assistant</h3>
                    <div className="flex-1"></div>
                    <div className="px-3 py-1 bg-cyan-500/20 rounded-full text-xs text-cyan-300 border border-cyan-500/30">
                        Online
                    </div>
                </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex animate-slide-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-2xl transition-all duration-300 ${
                            msg.sender === 'user' 
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/20' 
                                : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-200'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {msg.text}
                                {msg.sender === 'ai' && isLoading && index === messages.length - 1 && (
                                    <span className="inline-flex ml-1">
                                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></span>
                                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse ml-1" style={{animationDelay: '0.2s'}}></span>
                                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse ml-1" style={{animationDelay: '0.4s'}}></span>
                                    </span>
                                )}
                            </p>
                            {/* Message timestamp */}
                            <div className="mt-1 text-xs opacity-70">
                                {msg.sender === 'user' ? 'You' : 'AI'}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-slate-700/30">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Send a message..."
                        className="flex-1 p-4 bg-slate-900/50 backdrop-blur-sm border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-500"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSendMessage} 
                        disabled={isLoading || !input.trim()} 
                        className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-600 text-white p-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-500/30 disabled:shadow-none"
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};