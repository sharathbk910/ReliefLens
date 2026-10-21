import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  barColor?: string;
  className?: string;
}

export function AudioWaveform({
  stream,
  isRecording,
  barColor = '#f43f5e',
  className = '',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    let audioCtx: AudioContext;
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
    } catch (e) {
      console.warn('Web Audio API not supported in this browser', e);
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 24;
      const barWidth = 3;
      const gap = 4;
      const totalWidth = numBars * barWidth + (numBars - 1) * gap;
      const startX = Math.max(0, (canvas.width - totalWidth) / 2);

      for (let i = 0; i < numBars; i++) {
        // Map bar index to frequency bin (symmetric around center for pleasing visual)
        const binIndex = Math.min(
          bufferLength - 1,
          Math.floor(Math.abs(i - numBars / 2) * (bufferLength / (numBars / 2)))
        );
        const value = dataArray[binIndex] || 0;
        const percent = value / 255;
        const minHeight = 4;
        const maxHeight = canvas.height - 4;
        const barHeight = Math.max(minHeight, percent * maxHeight);

        const x = startX + i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        // Rounded bar
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [stream, isRecording, barColor]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={180}
        height={36}
        className="w-[180px] h-[36px] mx-auto opacity-90 transition-opacity"
      />
    </div>
  );
}
