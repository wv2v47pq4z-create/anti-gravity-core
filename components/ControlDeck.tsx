import React from 'react';
import { Zap, Power, Maximize2, Settings, Mic, MicOff } from 'lucide-react';
import { ConnectionState, VisualizerMode, ZacConfig } from '../types';
import ResonanceChart from './ResonanceChart';

interface ControlDeckProps {
    connectionState: ConnectionState;
    onConnect: () => void;
    onDisconnect: () => void;
    visMode: VisualizerMode;
    setVisMode: (m: VisualizerMode) => void;
    config: ZacConfig;
    setConfig: React.Dispatch<React.SetStateAction<ZacConfig>>;
    isMuted: boolean;
    toggleMute: () => void;
    resonanceData: { time: string, intensity: number, coherence: number }[];
}

export default function ControlDeck({
    connectionState, onConnect, onDisconnect,
    visMode, setVisMode,
    config, setConfig,
    isMuted, toggleMute,
    resonanceData
}: ControlDeckProps) {

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setConfig(prev => ({ ...prev, volume: v }));
    };

    return (
        <aside className="w-80 border-r border-cyan-900/30 bg-slate-900/20 p-6 flex flex-col gap-8 overflow-y-auto hidden md:flex">

            {/* Connection Control */}
            <div className="space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Core Power
                </h2>
                {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                    <button
                        onClick={onConnect}
                        className="w-full py-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-sm font-bold tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(8,145,178,0.2)] hover:shadow-[0_0_25px_rgba(8,145,178,0.4)] flex items-center justify-center gap-2 group"
                    >
                        <Power className="w-4 h-4 group-hover:text-white" /> ENGAGE GRAVITY
                    </button>
                ) : (
                    <button
                        onClick={onDisconnect}
                        className="w-full py-4 bg-red-950/30 hover:bg-red-900/50 border border-red-900 text-red-400 rounded-sm font-bold tracking-widest transition-all"
                    >
                        ABORT PROTOCOL
                    </button>
                )}
            </div>

            {/* Visual Settings */}
            <div className="space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Maximize2 className="w-3 h-3" /> Visual Matrix
                </h2>
                <div className="grid grid-cols-3 gap-2">
                    {[VisualizerMode.ORB, VisualizerMode.WAVE, VisualizerMode.BARS].map(m => (
                        <button
                            key={m}
                            onClick={() => setVisMode(m)}
                            className={`p-2 text-[10px] border rounded-sm transition-colors ${visMode === m
                                    ? 'bg-cyan-900/50 border-cyan-500 text-cyan-100'
                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-cyan-800'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio Settings */}
            <div className="space-y-6">
                <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Audio Parameters
                </h2>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span>Output Gain</span>
                        <span>{Math.round(config.volume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={config.volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs">Input Mute</span>
                    <button
                        onClick={toggleMute}
                        className={`p-2 rounded-full border ${isMuted ? 'border-red-500 bg-red-950 text-red-500' : 'border-cyan-800 bg-slate-900 text-cyan-700'}`}
                    >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Resonance Chart */}
            <div className="h-40 border border-slate-800 bg-slate-900/50 rounded-sm p-2 relative">
                <div className="absolute top-1 left-2 text-[10px] text-slate-500 uppercase">Field Intensity</div>
                <ResonanceChart data={resonanceData} />
            </div>

        </aside>
    );
}
