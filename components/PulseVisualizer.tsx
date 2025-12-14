import React, { useRef, useEffect } from 'react';
import { VisualizerMode } from '../types';

interface PulseVisualizerProps {
  analyser: AnalyserNode | null;
  mode: VisualizerMode;
  isActive: boolean;
  isResonating: boolean; // New prop for keyword triggers
  primaryColor: string;
}

const PulseVisualizer: React.FC<PulseVisualizerProps> = ({ analyser, mode, isActive, isResonating, primaryColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef<number>(0); // Persist rotation across re-renders

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 300;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      // Clear with trail effect
      ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Slate-950 with opacity for trails
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Floating calculation (Zero Gravity bobbing)
      const time = Date.now() * 0.002;
      const floatOffset = Math.sin(time) * 15; // Bob up and down by 15px

      if (!analyser && !isActive) {
         // Idle state with float
         const cy = (canvas.height / 2) + floatOffset;
         
         ctx.beginPath();
         ctx.strokeStyle = '#1e293b';
         ctx.lineWidth = 1;
         ctx.arc(canvas.width / 2, cy, 50, 0, Math.PI * 2);
         ctx.stroke();
         animationRef.current = requestAnimationFrame(draw);
         return;
      }

      const cx = canvas.width / 2;
      const cy = (canvas.height / 2) + floatOffset;
      const maxRadius = Math.min(cx, canvas.height/2) - 40; // Adjust for float range

      // Data collection
      let bufferLength = 0;
      let dataArray = new Uint8Array(0);

      if (analyser) {
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
      } else if (isActive) {
        // Simulated idle activity when connected but silent
        bufferLength = 64;
        dataArray = new Uint8Array(64).fill(10);
      }

      // Dynamic color based on resonance
      const activeColor = isResonating ? '#a855f7' : primaryColor; // Purple if resonating, else Cyan
      const glowColor = isResonating ? '#d8b4fe' : '#22d3ee';

      if (mode === VisualizerMode.ORB) {
        // Increment persistent rotation
        rotationRef.current += 0.005;
        const rotation = rotationRef.current;
        
        // Outer Ring
        ctx.beginPath();
        const step = 8; 
        for (let i = 0; i < bufferLength; i += step) {
          const value = dataArray[i] || 0;
          // Scale radius by resonance
          const boost = isResonating ? 1.2 : 1.0;
          const r = (60 + (value / 255) * (maxRadius - 60)) * boost;
          
          const angle = (i / bufferLength) * Math.PI * 2 + rotation;
          
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          
          if (i === 0) ctx.moveTo(x, y);
          // Curve for smoother look
          else {
             const prevAngle = ((i - step) / bufferLength) * Math.PI * 2 + rotation;
             const prevValue = dataArray[i - step] || 0;
             const prevR = (60 + (prevValue / 255) * (maxRadius - 60)) * boost;
             const cpX = cx + Math.cos((angle + prevAngle)/2) * (r + prevR)/2;
             const cpY = cy + Math.sin((angle + prevAngle)/2) * (r + prevR)/2;
             ctx.quadraticCurveTo(cpX, cpY, x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = isResonating ? 4 : 2;
        ctx.shadowBlur = isResonating ? 30 : 15;
        ctx.shadowColor = glowColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner Core
        const avg = dataArray.length > 0 ? dataArray.reduce((a, b) => a + b, 0) / bufferLength : 0;
        ctx.beginPath();
        const coreRadius = (20 + (avg / 255) * 30) * (isResonating ? 1.5 : 1);
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.fill();

        // Decorative Rings (Static relative to float)
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#1e293b';
        ctx.setLineDash([5, 15]);
        ctx.stroke();
        ctx.setLineDash([]);

      } else if (mode === VisualizerMode.WAVE) {
         if (analyser) analyser.getByteTimeDomainData(dataArray);
         
         ctx.lineWidth = isResonating ? 4 : 2;
         ctx.strokeStyle = activeColor;
         ctx.shadowBlur = isResonating ? 20 : 0;
         ctx.shadowColor = glowColor;
         
         ctx.beginPath();
         const sliceWidth = canvas.width * 1.0 / bufferLength;
         let x = 0;
         for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height / 2) + floatOffset; // Apply float to wave center
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
         }
         ctx.stroke();
         ctx.shadowBlur = 0;

      } else if (mode === VisualizerMode.BARS) {
         const barWidth = (canvas.width / bufferLength) * 2.5;
         let barHeight;
         let x = 0;
         for(let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 2) * (isResonating ? 1.3 : 1);
            ctx.fillStyle = activeColor;
            // Mirror effect centered on floating cy
            ctx.fillRect(x, cy - barHeight, barWidth, barHeight * 2);
            x += barWidth + 1;
         }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, mode, isActive, isResonating, primaryColor]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default PulseVisualizer;