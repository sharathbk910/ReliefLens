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
import { useToast } from './ui/Toast.tsx';
import { AudioWaveform } from './voice/AudioWaveform.tsx';
import { dataService } from '../lib/dataService.ts';
import { config } from '../config/env.ts';
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
  const toast = useToast();
  const [recorderState, setRecorderState] = useState<VoiceRecorderState>('ready');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasVoiceEngine] = useState(() => config.ai.hasClientKey);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);
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
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
        speechRecognitionRef.current = null;
      }
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
    setLiveTranscript('');
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

      // Start client-side speech recognition in parallel if supported
      if (typeof window !== 'undefined') {
        const SpeechRecognitionClass =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionClass) {
          try {
            const recognition = new SpeechRecognitionClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = navigator.language || 'en-US';
            recognition.onresult = (event: any) => {
              let text = '';
              for (let i = 0; i < event.results.length; ++i) {
                text += event.results[i][0].transcript;
              }
              if (text.trim()) {
                setLiveTranscript(text.trim());
              }
            };
            recognition.onerror = () => {
              // Graceful: ignore SpeechRecognition errors; raw audio is processed via Gemini
            };
            recognition.start();
            speechRecognitionRef.current = recognition;
          } catch (e) {
            console.debug('SpeechRecognition initialization skipped:', e);
          }
        }
      }

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
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    stopAllTracks();
  };

  const handleRecordAgain = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setLiveTranscript('');
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

  const analyzeReport = async () => {
    if (!audioBlob) {
      setErrorMessage('Unable to analyse your report. Please try again.');
      setRecorderState('error');
      return;
    }

    try {
      setRecorderState('analyzing');
      setErrorMessage(null);

      // Invoke multilingual voice analysis through backend service with live speech hint
      const result = await dataService.analyzeVoiceReport(audioBlob, liveTranscript);

      setRecorderState('review_ready');
      toast.success('Your report has been analysed.');
      onExtractionSuccess(result);
    } catch (err: any) {
      console.error('Voice analysis failed', err);
      setErrorMessage('Unable to analyse your report. Please try again.');
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
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5" />
                Active
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Speak in any language (e.g. Kannada, Hindi, English, Tamil, Telugu). Your report will be analysed automatically.
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
          {/* Spatial Focal Object: Single Large Circular Button with Static Outer Ring */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <button
              type="button"
              onClick={startRecording}
              disabled={recorderState === 'requesting_permission'}
              aria-label="Start Voice Recording"
              className="w-24 h-24 rounded-full p-1.5 border-2 border-[var(--border-strong)] hover:border-rose-500/60 transition-colors focus-visible:ring-2 flex items-center justify-center group cursor-pointer"
            >
              <div className="w-full h-full rounded-full bg-[var(--surface-1-solid)] group-hover:bg-rose-500/10 border border-[var(--border-subtle)] flex items-center justify-center transition-all duration-200 shadow-sm">
                {recorderState === 'requesting_permission' ? (
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Mic className="w-8 h-8 text-rose-500 group-hover:scale-105 transition-transform" strokeWidth={1.5} />
                )}
              </div>
            </button>
          </div>

          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Ready to Record</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            Click the circular microphone to begin. Speak naturally in any language.
          </p>

          {onSwitchToManual && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={onSwitchToManual} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Type Manually Instead
              </Button>
            </div>
          )}
        </div>
      ) : recorderState === 'recording' ? (
        <div className="text-center py-6 px-4">
          {/* Spatial Focal Object: Active Recording Ring with Tabular Timer */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <button
              type="button"
              onClick={stopRecording}
              aria-label="Stop Voice Recording"
              className="w-28 h-28 rounded-full p-2 border-2 border-rose-500 transition-colors focus-visible:ring-2 flex items-center justify-center group cursor-pointer relative"
            >
              {/* Single Subtle Animated Indicator (Disabled under reduced motion) */}
              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-rose-500 animate-subtle-pulse" />

              <div className="w-full h-full rounded-full bg-rose-500/15 border border-rose-500/40 flex flex-col items-center justify-center shadow-inner">
                <Square className="w-5 h-5 fill-rose-500 text-rose-500 mb-1" strokeWidth={1.5} />
                <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </button>
          </div>

          <div className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
            Recording in Progress
          </div>
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            {formatTime(elapsedSeconds)} / {formatTime(MAX_RECORDING_SECONDS)} • Tap circle to stop
          </p>

          <AudioWaveform
            stream={streamRef.current}
            isRecording={recorderState === 'recording'}
            barColor="#f43f5e"
            className="mt-4"
          />

          {liveTranscript && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-emerald-500/30 text-left max-h-24 overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1.5 mb-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Real-Time Voice Detection:
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{liveTranscript}"
              </p>
            </div>
          )}
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

            {liveTranscript && (
              <div className="mt-3 pt-3 border-t border-slate-700/60 text-left">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Spoken Words Detected
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{liveTranscript}"
                </p>
              </div>
            )}
          </div>

          {/* Explicit Submission */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Audio is securely processed to analyse and extract incident details.</span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={analyzeReport}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-900/30 shrink-0 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              Analyse Report
            </Button>
          </div>
        </div>
      ) : recorderState === 'analyzing' ? (
        <div className="text-center py-8 px-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 animate-spin">
            <Sparkles className="w-7 h-7 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Analysing your report...</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Detecting spoken language, transcribing speech, and extracting emergency details...
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing emergency observations</span>
          </div>
        </div>
      ) : (
        /* Error State */
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-800/40">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-rose-200">Processing Notice</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {errorMessage || 'Unable to analyse your report. Please try again.'}
              </p>

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
