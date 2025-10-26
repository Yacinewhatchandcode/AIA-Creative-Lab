import React, { useState, useRef, useEffect } from 'react';
import type { LiveSession } from '@google/genai';
import { startLiveSession, closeLiveSession } from '../services/liveService';
import { MicrophoneIcon, SpinnerIcon } from './icons';

interface TranscriptEntry {
    speaker: 'You' | 'AI';
    text: string;
}

export const LiveChat: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [transcript]);

    const handleProgress = (update: any) => {
        if (update.transcript) {
            setTranscript(prev => {
                const newTranscript = [...prev];
                const lastEntry = newTranscript[newTranscript.length - 1];
                if (lastEntry && lastEntry.speaker === update.speaker) {
                    lastEntry.text = update.transcript;
                } else {
                    newTranscript.push({ speaker: update.speaker, text: update.transcript });
                }
                return newTranscript;
            });
        }
        if (update.error) {
            setError(`An error occurred: ${update.error}`);
            stopConversation();
        }
    };

    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        setTranscript([]);

        try {
            const { session, audioContext, mediaStream, scriptProcessor } = await startLiveSession(handleProgress);
            sessionRef.current = session;
            audioContextRef.current = audioContext;
            mediaStreamRef.current = mediaStream;
            scriptProcessorRef.current = scriptProcessor;
            setIsActive(true);
            setTranscript([{ speaker: 'AI', text: "Hello! I'm listening..." }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start the session.');
        } finally {
            setIsConnecting(false);
        }
    };

    const stopConversation = () => {
        if (sessionRef.current) {
            closeLiveSession(
                sessionRef.current,
                audioContextRef.current,
                mediaStreamRef.current,
                scriptProcessorRef.current
            );
        }
        sessionRef.current = null;
        audioContextRef.current = null;
        mediaStreamRef.current = null;
        scriptProcessorRef.current = null;
        setIsActive(false);
    };

    useEffect(() => {
        // Cleanup on component unmount
        return () => stopConversation();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center">
                <button
                    onClick={isActive ? stopConversation : startConversation}
                    disabled={isConnecting}
                    className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'
                    } text-white shadow-lg`}
                >
                    {isConnecting ? <SpinnerIcon className="w-10 h-10" /> : <MicrophoneIcon className="w-10 h-10" />}
                    {isActive && <div className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></div>}
                </button>
                <p className="mt-4 text-slate-400">{isConnecting ? 'Connecting...' : isActive ? 'Conversation is live. Tap to stop.' : 'Tap to start conversation.'}</p>
            </div>
            
            {error && <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}

            <div className="h-[50vh] bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {transcript.map((entry, index) => (
                        <div key={index}>
                            <p className={`font-bold ${entry.speaker === 'AI' ? 'text-cyan-400' : 'text-slate-300'}`}>{entry.speaker}</p>
                            <p className="text-slate-200 whitespace-pre-wrap">{entry.text}</p>
                        </div>
                    ))}
                     <div ref={transcriptEndRef} />
                </div>
            </div>
        </div>
    );
};