import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';

let nextStartTime = 0;
let outputAudioContext: AudioContext | null = null;
let outputNode: GainNode | null = null;
const sources = new Set<AudioBufferSourceNode>();

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

export const startLiveSession = async (
    onProgress: (update: any) => void
): Promise<{ 
    session: LiveSession, 
    audioContext: AudioContext, 
    mediaStream: MediaStream, 
    scriptProcessor: ScriptProcessorNode 
}> => {
    if (!process.env.API_KEY) throw new Error("API Key not set.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- Output Audio Setup ---
    // Fix: Cast `window` to `any` to access `webkitAudioContext` without a TypeScript error,
    // ensuring compatibility with older browsers.
    outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    nextStartTime = 0;
    sources.clear();

    let currentInputTranscription = '';
    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {},
            onmessage: async (message: LiveServerMessage) => {
                // Handle transcription
                if (message.serverContent?.outputTranscription) {
                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                    onProgress({ transcript: currentOutputTranscription, speaker: 'AI' });
                }
                if (message.serverContent?.inputTranscription) {
                    currentInputTranscription += message.serverContent.inputTranscription.text;
                     onProgress({ transcript: currentInputTranscription, speaker: 'You' });
                }
                if (message.serverContent?.turnComplete) {
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                // Handle audio output
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContext && outputNode) {
                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                    const source = outputAudioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    source.addEventListener('ended', () => sources.delete(source));
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }

                if (message.serverContent?.interrupted) {
                    sources.forEach(source => source.stop());
                    sources.clear();
                    nextStartTime = 0;
                }
            },
            onerror: (e: ErrorEvent) => onProgress({ error: e.message }),
            onclose: () => {},
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
    });

    // --- Input Audio Setup ---
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Fix: Cast `window` to `any` to access `webkitAudioContext` without a TypeScript error,
    // ensuring compatibility with older browsers.
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = inputAudioContext.createMediaStreamSource(stream);
    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContext.destination);

    const session = await sessionPromise;
    return { session, audioContext: inputAudioContext, mediaStream: stream, scriptProcessor };
};

export const closeLiveSession = (
    session: LiveSession,
    audioContext: AudioContext | null,
    mediaStream: MediaStream | null,
    scriptProcessor: ScriptProcessorNode | null,
) => {
    session.close();
    if (scriptProcessor) scriptProcessor.disconnect();
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContext) audioContext.close();
    if (outputAudioContext) outputAudioContext.close();
};