'use client';

/**
 * Trailer - a full-screen intro clip shown once when the Money Tree game is
 * first opened (before the setup screen). It tries to autoplay with sound; if
 * the browser blocks audio autoplay it falls back to muted autoplay (always
 * allowed) and offers a tap-for-sound button. A Skip control and the video's
 * own end both call onDone to reveal the game.
 */

import { useEffect, useRef, useState } from 'react';

export default function Trailer({ src, onDone }: { src: string; onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      // Autoplay-with-audio blocked → mute and retry (muted autoplay is allowed).
      v.muted = true;
      setMuted(true);
      v.play().catch(() => {});
    });
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) v.play().catch(() => {});
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        preload="auto"
        onEnded={onDone}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />

      <button
        type="button"
        onClick={onDone}
        className="font-display"
        style={{
          position: 'absolute',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 16,
          zIndex: 2,
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          background: 'rgba(20,16,40,.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 14,
          padding: '9px 18px',
        }}
      >
        Skip ▶
      </button>

      {muted && (
        <button
          type="button"
          onClick={toggleMute}
          className="font-display"
          style={{
            position: 'absolute',
            bottom: 'max(24px, env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            border: 'none',
            cursor: 'pointer',
            color: '#22203A',
            background: 'rgba(255,255,255,.92)',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 20px',
            boxShadow: '0 10px 24px -10px rgba(0,0,0,.5)',
          }}
        >
          🔊 Tap for sound
        </button>
      )}
    </div>
  );
}
