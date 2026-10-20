import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  Shield,
  Loader2,
  Volume2,
} from 'lucide-react';
import { Button } from './ui/Button.tsx';
import { Badge } from './ui/Badge.tsx';
import { dataService } from '../lib/dataService.ts';
import type { VoiceExtractionResult } from '../shared/types.ts';

export type VoiceRecorderState =
  | 'ready'
  | 'requesting_permission'
  | 'recording'
  | 'recording_stopped'
  | 'playing_audio'
  | 'uploading'
  | 'analyzing'
  | 'review_ready'
  | 'error'
  | 'unsupported';

interface VoiceRecorderProps {
  onExtractionSuccess: (extraction: VoiceExtractionResult) => void;
  onCancel?: () => void;
  onSwitchToManual?: () => void;
}

const MAX_RECORDING_SECONDS = 60;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export function VoiceRecorder({
  onExtractionSuccess,
  onCancel,
  onSwitchToManual,
}: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>('ready');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      navigator?.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder === 'function';

    if (!isSupported) {
      setRecorderState('unsupported');
    }

    return () => {
      // Clean up microphone tracks and timer on unmount
      stopAllTracks();
      clearTimer();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Determine best supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setRecorderState('requesting_permission');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopAllTracks();
        clearTimer();
        const blobMime = mediaRecorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: blobMime });

        if (finalBlob.size === 0) {
          setErrorMessage('No audio captured. Please speak into your microphone and try again.');
          setRecorderState('error');
          return;
        }

        if (finalBlob.size > MAX_UPLOAD_BYTES) {
          setErrorMessage('Audio recording exceeds the 8MB size limit. Please record a shorter message.');
          setRecorderState('error');
          return;
        }

        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setRecorderState('recording_stopped');
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setRecorderState('recording');
      setElapsedSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      stopAllTracks();
      clearTimer();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser address bar to use voice reporting, or switch to manual reporting.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone device found on your system. Please connect a microphone or use manual reporting.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Unable to access audio input.'}`);
      }
      setRecorderState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    stopAllTracks();
  };

  const handleRecordAgain = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setIsPlaying(false);
    setRecorderState('ready');
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.error('Audio playback error', e);
            setIsPlaying(false);
          });
      }
    }
  };

  const analyzeWithGemini = async () => {
    if (!audioBlob) {
      setErrorMessage('No recorded audio to analyze.');
      setRecorderState('error');
      return;
    }

    try {
      setRecorderState('analyzing');
      setErrorMessage(null);

      // Invoke official Gemini voice analysis through Edge Function
      const result = await dataService.analyzeVoiceReport(audioBlob);

      setRecorderState('review_ready');
      onExtractionSuccess(result);
    } catch (err: any) {
      console.error('Voice analysis failed', err);
      setErrorMessage(
        err.message ||
          'Failed to analyze voice recording with Google Gemini. You can retry recording or continue with manual reporting.'
      );
      setRecorderState('error');
    }
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Multilingual Voice Reporting
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                AI Powered
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Speak in any language (e.g. Kannada, Hindi, English, Tamil, Telugu). Gemini detects speech automatically.
            </p>
          </div>
        </div>

        {recorderState === 'recording' && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            RECORDING ({formatTime(elapsedSeconds)} / {formatTime(MAX_RECORDING_SECONDS)})
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      {recorderState === 'unsupported' ? (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h4 className="text-sm font-medium text-rose-200">Browser Audio Not Supported</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Your browser does not support the MediaRecorder API required for voice recording. Please use the manual
            reporting form instead.
          </p>
          {onSwitchToManual && (
            <Button variant="outline" size="sm" onClick={onSwitchToManual} className="mt-3">
              Switch to Manual Reporting
            </Button>
          )}
        </div>
      ) : recorderState === 'ready' || recorderState === 'requesting_permission' ? (
        <div className="text-center py-6 px-4">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg shadow-emerald-500/10">
              <Mic className="w-9 h-9 text-emerald-400" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-slate-200">Ready to Record Emergency</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Click the button below to start. Describe the emergency naturally: location, what happened, who is at risk,
            and immediate dangers.
          </p>

          <div className="flex items-center justify-center gap-3 mt-5">
            <Button
              variant="primary"
              onClick={startRecording}
              disabled={recorderState === 'requesting_permission'}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-900/30"
            >
              {recorderState === 'requesting_permission' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Requesting Mic Access...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Recording
                </>
              )}
            </Button>

            {onSwitchToManual && (
              <Button variant="ghost" size="sm" onClick={onSwitchToManual} className="text-slate-400 hover:text-slate-200">
                Type Manually Instead
              </Button>
            )}
          </div>
        </div>
      ) : recorderState === 'recording' ? (
        <div className="text-center py-6 px-4">
          {/* Audio Pulsing Visualizer Indicator */}
          <div className="flex items-center justify-center gap-1.5 h-16 mb-4">
            {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-rose-500 rounded-full transition-all duration-150 animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i * 0.08).toFixed(2)}s`,
                }}
              />
            ))}
          </div>

          <div className="text-2xl font-mono font-bold text-white mb-1">
            {formatTime(elapsedSeconds)}
          </div>
          <p className="text-xs text-slate-400">
            Speaking now... Max duration {MAX_RECORDING_SECONDS}s. Press Stop when finished.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              variant="danger"
              size="lg"
              onClick={stopRecording}
              className="gap-2 font-medium shadow-lg shadow-rose-950/50"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop Recording
            </Button>
          </div>
        </div>
      ) : recorderState === 'recording_stopped' ? (
        <div className="py-4 px-2">
          <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Audio Recording Captured ({formatTime(elapsedSeconds)})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : ''}
              </span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                className="gap-2 text-slate-200 border-slate-600 hover:bg-slate-700"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                {isPlaying ? 'Pause Playback' : 'Listen to Recording'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRecordAgain}
                className="gap-1.5 text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Record Again
              </Button>
            </div>
          </div>

          {/* Explicit Submission to Gemini */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Audio is securely transmitted to Gemini for transcription and extraction.</span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={analyzeWithGemini}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-900/30 shrink-0 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              Analyze with Gemini
            </Button>
          </div>
        </div>
      ) : recorderState === 'analyzing' ? (
        <div className="text-center py-8 px-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 animate-spin">
            <Sparkles className="w-7 h-7 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Analyzing Speech with Google Gemini</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Detecting spoken language, generating original transcription, producing normalized description, and
            extracting emergency details...
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing audio via secure Supabase Edge Function</span>
          </div>
        </div>
      ) : (
        /* Error State */
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-rose-200">Voice Processing Notice</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{errorMessage}</p>

              <div className="flex items-center gap-2.5 mt-4">
                <Button variant="outline" size="sm" onClick={handleRecordAgain} className="gap-1.5 border-slate-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Recording Again
                </Button>
                {onSwitchToManual && (
                  <Button variant="primary" size="sm" onClick={onSwitchToManual} className="bg-slate-700 hover:bg-slate-600">
                    Switch to Manual Reporting
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Privacy: Audio is used only for transcription and is not retained permanently.</span>
        <span>Max duration: 60s</span>
      </div>
    </div>
  );
}
