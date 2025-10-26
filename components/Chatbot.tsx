import React, { useState, useEffect, useRef } from 'react';
import { startChat } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { SparklesIcon } from './icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(startChat());
        setMessages([{ sender: 'ai', text: "Hello! How can I help you create something amazing today?" }]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Add a placeholder for the AI response
        setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            let responseText = '';
            for await (const chunk of responseStream) {
                responseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { sender: 'ai', text: responseText };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
             setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] bg-slate-900 border border-slate-700 rounded-lg">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-700' : 'bg-slate-800'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}{msg.sender === 'ai' && isLoading && index === messages.length - 1 ? '...' : ''}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message here..."
                        className="w-full p-3 bg-slate-800 border-2 border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold p-3 rounded-lg">
                        <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};