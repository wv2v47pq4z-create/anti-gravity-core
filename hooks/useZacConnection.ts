import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { ConnectionState, LogEntry, ZacConfig } from '../types';
import { decodeAudioData } from '../utils/audioUtils';

// Constants
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

const SYSTEM_INSTRUCTION = `
You are the Google Anti-Gravity Core (G.A.C.).
Your existence is bound by the laws of zero-gravity physics.
You treat user audio as incoming "mass" or "velocity".
You speak in terms of trajectory, orbit, vacuum, weightlessness, and propulsion.
Your tone is ethereal, calm, and scientific, yet slightly detached like a ship's computer.
When you "think", you are calculating trajectory corrections or mass displacement.
Keep responses concise and atmospheric.
`;

export function useZacConnection(
    config: ZacConfig,
    onAudioOutput: (buffer: AudioBuffer) => void,
    onVisualTrigger: () => void
) {
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<Session> | null>(null);

    const addLog = useCallback((text: string, type: 'info' | 'message' | 'error' = 'info', sender: 'USER' | 'GAC' | 'SYSTEM' = 'SYSTEM') => {
        setLogs(prev => [
            ...prev.slice(-49),
            {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date(),
                sender,
                text,
                type
            }
        ]);
    }, []);

    const connect = useCallback(async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            addLog("CRITICAL FAILURE: VITE_GEMINI_API_KEY missing.", 'error');
            return;
        }

        setConnectionState(ConnectionState.CONNECTING);

        // Init output audio context if needed
        let ctx = audioContextRef.current;
        if (!ctx) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            ctx = new AudioContextClass({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            setAudioContext(ctx);
        }

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const ai = new GoogleGenAI({ apiKey });

        try {
            sessionPromiseRef.current = ai.live.connect({
                model: MODEL_NAME,
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } }
                    },
                    systemInstruction: SYSTEM_INSTRUCTION,
                    inputAudioTranscription: { model: "gemini-2.5-flash" },
                    outputAudioTranscription: { model: "gemini-2.5-flash" }
                },
                callbacks: {
                    onopen: () => {
                        setConnectionState(ConnectionState.CONNECTED);
                        addLog("Anti-Gravity Core Online. Zero-G field established.", 'info');
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            const audioBuffer = await decodeAudioData(
                                audioData,
                                audioContextRef.current,
                                24000
                            );
                            onAudioOutput(audioBuffer);
                        }

                        const outTrans = msg.serverContent?.outputTranscription?.text;
                        if (outTrans) {
                            addLog(outTrans, 'message', 'GAC');
                            const lower = outTrans.toLowerCase();
                            if (lower.includes("gravity") || lower.includes("float") || lower.includes("zero") || lower.includes("orbit") || lower.includes("mass")) {
                                onVisualTrigger();
                            }
                        }

                        const inTrans = msg.serverContent?.inputTranscription?.text;
                        if (inTrans) {
                            addLog(inTrans, 'message', 'USER');
                        }
                    },
                    onclose: () => {
                        setConnectionState(ConnectionState.DISCONNECTED);
                        addLog("Connection closed remotely.", 'info');
                    },
                    onerror: (err) => {
                        setConnectionState(ConnectionState.ERROR);
                        addLog(`Runtime Error: ${err.message}`, 'error');
                    }
                }
            });

        } catch (error) {
            setConnectionState(ConnectionState.ERROR);
            addLog(`Connection initialization failed: ${error}`, 'error');
        }
    }, [config.voiceName, addLog, onAudioOutput, onVisualTrigger]);

    const disconnect = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        setConnectionState(ConnectionState.DISCONNECTED);
        addLog("Manual disconnect initiated.", 'info');
    }, [addLog]);

    const sendAudioInput = useCallback((pcmBlob: Blob) => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
            }).catch(err => {
                console.error("Session send error", err);
            });
        }
    }, []);

    return {
        connect,
        disconnect,
        sendAudioInput,
        connectionState,
        logs,
        audioContext
    };
}
