'use client';

import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, Repeat, Volume2, VolumeX, X } from 'lucide-react';
import Link from 'next/link';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isLooping,
    currentTime,
    duration,
    volume,
    toggle,
    seekTo,
    setVolume,
    toggleLoop,
    close,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white z-40 border-t border-white/10">
      {/* Progress bar (thin clickable bar at top) */}
      <div
        className="h-1 bg-white/10 cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-accent transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3">
          {/* Play/Pause */}
          <button
            onClick={toggle}
            className="w-10 h-10 bg-accent text-black flex items-center justify-center flex-shrink-0 hover:bg-accent/90 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-semibold truncate">{currentTrack.title}</p>
            <p className="font-mono text-xs text-white/70 truncate">
              {currentTrack.producerSlug ? (
                <Link href={`/u/${currentTrack.producerSlug}`} className="hover:text-accent no-underline">
                  {currentTrack.producer}
                </Link>
              ) : (
                currentTrack.producer
              )}
              {currentTrack.bpm && ` · ${currentTrack.bpm} BPM`}
              {currentTrack.musicalKey && ` · ${currentTrack.musicalKey}`}
            </p>
          </div>

          {/* Time */}
          <span className="font-mono text-[10px] text-white/60 hidden sm:block flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Loop */}
          <button
            onClick={toggleLoop}
            className={`p-2 transition-colors flex-shrink-0 ${
              isLooping ? 'text-accent' : 'text-white/30 hover:text-white/60'
            }`}
            title={isLooping ? 'Loop on' : 'Loop off'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-accent h-1"
            />
          </div>

          {/* Close */}
          <button
            onClick={close}
            className="text-white/30 hover:text-white/60 p-2 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
