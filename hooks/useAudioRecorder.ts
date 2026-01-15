import { useRef, useCallback, useState } from 'react';
import { createPCMBlob } from '../utils/audioUtils';

export function useAudioRecorder(
    onAudioData: (pcmBlob: Blob, rms: number) => void,
    isMuted: boolean
) {
    const inputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    const [inputContext, setInputContext] = useState<AudioContext | null>(null);

    const startRecording = useCallback(async () => {
        try {
            let ctx = inputContextRef.current;
            if (!ctx) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                ctx = new AudioContextClass({ sampleRate: 16000 });
                inputContextRef.current = ctx;
                setInputContext(ctx);
            }

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (isMuted) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPCMBlob(inputData);

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);

                onAudioData(pcmBlob, rms);
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);

            setIsRecording(true);
            return true;

        } catch (e) {
            console.error('Audio start failed', e);
            return false;
        }
    }, [isMuted, onAudioData]);

    const stopRecording = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        setIsRecording(false);
    }, []);

    return {
        startRecording,
        stopRecording,
        isRecording,
        inputContext
    };
}
