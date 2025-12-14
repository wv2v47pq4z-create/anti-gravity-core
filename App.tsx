import { useState, useCallback, useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import PulseVisualizer from './components/PulseVisualizer';
import ControlDeck from './components/ControlDeck';
import LogPanel from './components/LogPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useZacConnection } from './hooks/useZacConnection';
import { ConnectionState, VisualizerMode, ZacConfig } from './types';

// Constants
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

const INITIAL_CONFIG: ZacConfig = {
    sensitivity: 75,
    volume: 1.0,
    resonance: 50,
    voiceName: 'Kore' // Aoede, Charon, Fenrir, Kore, Puck
};

function AppContent() {
    // --- State ---
    const [config, setConfig] = useState<ZacConfig>(INITIAL_CONFIG);
    const [isMuted, setIsMuted] = useState(false);
    const [visMode, setVisMode] = useState<VisualizerMode>(VisualizerMode.ORB);
    const [resonanceData, setResonanceData] = useState<{ time: string, intensity: number, coherence: number }[]>([]);

    // Visual feedback
    const [isResonating, setIsResonating] = useState(false);

    // Audio Output
    const outputGainRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // We need a ref to access audioContext inside the callback (which is defined before audioContext is available from the hook)
    const audioContextRef = useRef<AudioContext | null>(null);

    // Visualization
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    const onVisualTrigger = useCallback(() => {
        setIsResonating(true);
    }, []);

    const {
        connect,
        disconnect,
        sendAudioInput,
        connectionState,
        logs,
        audioContext
    } = useZacConnection(config, (buffer) => {
        if (!audioContextRef.current || !outputGainRef.current) return;

        const ctx = audioContextRef.current;
        const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(outputGainRef.current);
        source.start(startTime);

        nextStartTimeRef.current = startTime + buffer.duration;

        scheduledSourcesRef.current.add(source);
        source.onended = () => {
            scheduledSourcesRef.current.delete(source);
        };
    }, onVisualTrigger);

    // Sync hook context to ref
    useEffect(() => {
        audioContextRef.current = audioContext;
    }, [audioContext]);

    // --- Audio System initialization Effect ---
    useEffect(() => {
        if (audioContext && !outputGainRef.current) {
            // Setup Output Chain
            outputGainRef.current = audioContext.createGain();

            const newAnalyser = audioContext.createAnalyser();
            newAnalyser.fftSize = 512;
            newAnalyser.smoothingTimeConstant = 0.8;

            outputGainRef.current.connect(newAnalyser);
            newAnalyser.connect(audioContext.destination);

            // eslint-disable-next-line react-hooks/rules-of-hooks
            setAnalyser(newAnalyser);
        }
    }, [audioContext, config.volume]);

    // Update Volume
    useEffect(() => {
        if (outputGainRef.current) {
            outputGainRef.current.gain.value = config.volume;
        }
    }, [config.volume]);

    // --- Input Recorder ---
    const { startRecording: startMic, stopRecording: stopMic } = useAudioRecorder(
        (pcmBlob, rms) => {
            // Send to API
            sendAudioInput(pcmBlob);

            // Update Charts
            if (Math.random() > 0.8) {
                const intensity = Math.min(rms * 400, 100);
                setResonanceData(prev => {
                    const now = new Date();
                    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                    const newData = [...prev, {
                        time: timeStr,
                        intensity: intensity,
                        coherence: 30 + Math.random() * 40
                    }];
                    return newData.slice(-20);
                });
            }
        },
        isMuted
    );

    // Handle Connection State Changes for Mic
    useEffect(() => {
        if (connectionState === ConnectionState.CONNECTED) {
            startMic();
        } else {
            stopMic();
        }
    }, [connectionState, startMic, stopMic]);

    // Cleanup Effect
    useEffect(() => {
        return () => {
            scheduledSourcesRef.current.forEach(s => s.stop());
        };
    }, []);

    // Visual Effects Timer
    useEffect(() => {
        if (isResonating) {
            const timer = setTimeout(() => setIsResonating(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isResonating]);


    return (
        <div className="min-h-screen bg-slate-950 text-cyan-500 overflow-hidden flex flex-col font-mono selection:bg-cyan-900 selection:text-cyan-100">
            {/* Header */}
            <header className="h-16 border-b border-cyan-900/50 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <Activity className={`w-6 h-6 ${connectionState === ConnectionState.CONNECTED ? 'animate-pulse text-purple-400' : 'text-slate-600'}`} />
                    <div>
                        <h1 className="text-xl font-bold font-orbitron tracking-wider text-cyan-100">ANTI-GRAVITY OS</h1>
                        <p className="text-[10px] text-cyan-700 tracking-[0.2em] uppercase">G.A.C. Protocol v2.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${connectionState === ConnectionState.CONNECTED ? 'border-purple-500 bg-purple-950 text-purple-300' :
                        connectionState === ConnectionState.CONNECTING ? 'border-yellow-600 bg-yellow-950 text-yellow-300' :
                            'border-slate-800 bg-slate-900 text-slate-400'
                        }`}>
                        {connectionState}
                    </div>
                </div>
            </header>

            {/* Main Deck */}
            <main className="flex-1 flex overflow-hidden">

                <ControlDeck
                    connectionState={connectionState}
                    onConnect={connect}
                    onDisconnect={disconnect}
                    visMode={visMode}
                    setVisMode={setVisMode}
                    config={config}
                    setConfig={setConfig}
                    isMuted={isMuted}
                    toggleMute={() => setIsMuted(!isMuted)}
                    resonanceData={resonanceData}
                />

                {/* Center: The Core */}
                <section className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

                    {/* The Visualizer */}
                    <div className="relative w-full max-w-2xl aspect-square max-h-[70vh] flex items-center justify-center">
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isResonating ? 'opacity-30' : 'opacity-0'}`}>
                            <div className="w-full h-full rounded-full bg-purple-500/20 blur-[100px] animate-pulse"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-[80%] h-[80%] rounded-full bg-cyan-500/5 blur-[100px] transition-opacity duration-1000 ${connectionState === ConnectionState.CONNECTED && !isResonating ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <PulseVisualizer
                            analyser={analyser}
                            mode={visMode}
                            isActive={connectionState === ConnectionState.CONNECTED}
                            isResonating={isResonating}
                            primaryColor="#06b6d4" // cyan-500
                        />

                        {/* Status Text Overlay */}
                        <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                            <p className={`text-xs tracking-[0.5em] font-orbitron transition-colors duration-300 ${isResonating ? 'text-purple-400' : 'text-cyan-900/80'}`}>
                                {connectionState === ConnectionState.CONNECTED
                                    ? (isResonating ? 'GRAVITATIONAL ANOMALY DETECTED' : 'ZERO-G STABLE')
                                    : 'AWAITING MASS INPUT'}
                            </p>
                        </div>
                    </div>
                </section>

                <LogPanel logs={logs} modelName={MODEL_NAME} />

            </main>
        </div>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}