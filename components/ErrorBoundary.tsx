import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 text-red-500 flex flex-col items-center justify-center font-mono p-10 text-center">
                    <h1 className="text-4xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
                    <p className="mb-8">Anti-Gravity Core has encountered an unrecoverable error.</p>
                    <pre className="bg-slate-900 p-4 rounded text-left overflow-auto max-w-full text-xs">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors uppercase tracking-widest"
                    >
                        Reboot System
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
