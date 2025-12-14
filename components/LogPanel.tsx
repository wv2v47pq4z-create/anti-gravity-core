import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { LogEntry } from '../types';

interface LogPanelProps {
    logs: LogEntry[];
    modelName: string;
}

export default function LogPanel({ logs, modelName }: LogPanelProps) {
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <aside className="w-96 border-l border-cyan-900/30 bg-slate-950 flex flex-col">
            <div className="p-4 border-b border-cyan-900/30 bg-slate-900/50">
                <h2 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> System Log
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scroll-smooth">
                {logs.length === 0 && (
                    <div className="text-slate-700 text-center mt-10 italic px-8">
                        <p className="mb-4">Core initialized.</p>
                        <p>1. Ensure API_KEY is set.</p>
                        <p>2. Click <span className="text-cyan-400 font-bold">ENGAGE GRAVITY</span></p>
                    </div>
                )}
                {logs.map((log) => (
                    <div key={log.id} className={`flex flex-col gap-1 ${log.sender === 'USER' ? 'items-end text-right' : 'items-start'
                        }`}>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span>{log.timestamp.toLocaleTimeString()}</span>
                            <span className={`font-bold ${log.sender === 'GAC' ? 'text-cyan-500' :
                                log.sender === 'USER' ? 'text-purple-400' : 'text-slate-500'
                                }`}>[{log.sender}]</span>
                        </div>
                        <div className={`p-3 rounded-sm max-w-[90%] break-words border ${log.sender === 'GAC' ? 'bg-cyan-950/30 border-cyan-900 text-cyan-100' :
                            log.sender === 'USER' ? 'bg-purple-950/20 border-purple-900 text-purple-100' :
                                'bg-slate-900 border-slate-800 text-slate-400 italic'
                            }`}>
                            {log.text}
                        </div>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            {/* Status Footer */}
            <div className="p-2 border-t border-cyan-900/30 bg-slate-950 text-[10px] text-slate-600 flex justify-between">
                <span>API: {modelName}</span>
                <span>LATENCY: 24ms</span>
            </div>
        </aside>
    );
}
