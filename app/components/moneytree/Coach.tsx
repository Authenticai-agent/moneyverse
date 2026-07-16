'use client';

/**
 * Coach - the mascot's docked avatar + speech bubble. Centered along the top
 * of the Stage (between the HUD's two corner chips) so it never covers them.
 * The avatar itself is always visible and always clickable - dismissing the
 * bubble only hides the *text*, never the mascot, so there's always a way to
 * bring the message back. Re-appears automatically when the message changes.
 *
 * Sized with container query units (cqw), not viewport units - the Stage
 * this sits in (see MoneyTreeGame.tsx, `containerType: 'inline-size'`) can be
 * a small card or a full-viewport overlay, and those two cases can have very
 * different viewport widths for the same *stage* width, so vw would size
 * this wrong in one mode or the other. cqw tracks the stage itself.
 */

import { useEffect, useState } from 'react';

export default function Coach({ emoji, name, text, warn }: { emoji: string; name: string; text: string; warn?: boolean }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [text]); // show again when the message changes

  return (
    <div
      className="absolute z-[7] flex items-start justify-center"
      style={{ top: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)', maxWidth: 'clamp(320px, 46cqw, 680px)', gap: '2.2cqw' }}
    >
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        aria-label={hidden ? `Show ${name}'s message` : `Hide ${name}'s message`}
        aria-expanded={!hidden}
        style={{
          flexShrink: 0, cursor: 'pointer',
          width: 'clamp(44px, 5cqw, 88px)', height: 'clamp(44px, 5cqw, 88px)',
          fontSize: 'clamp(22px, 2.8cqw, 44px)', lineHeight: 1,
          background: 'rgba(255,255,255,.92)', border: '1px solid #E3EFE6', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 22px -12px rgba(60,40,120,.4)',
        }}
      >
        {emoji}
      </button>
      {!hidden && (
        <div
          className="font-display"
          style={{
            background: warn ? '#FCEFD2' : '#FBF3DD',
            border: warn ? '2px dashed #C9822B' : '2px dashed #B4935F',
            borderRadius: 'clamp(12px, 1.6cqw, 22px)',
            padding: 'clamp(8px, 1cqw, 18px) clamp(10px, 1.3cqw, 22px)',
            boxShadow: '0 14px 26px -14px rgba(90,60,20,.45)',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1cqw' }}>
            <span style={{ fontSize: 'clamp(11px, 1.3cqw, 20px)', fontWeight: 700, color: warn ? '#95590E' : '#7A5B2E', display: 'flex', alignItems: 'center', gap: 4 }}>
              {warn && <span aria-hidden>⚠️</span>}
              {name}
            </span>
            <button
              type="button"
              aria-label="Dismiss coach"
              onClick={() => setHidden(true)}
              style={{ border: 'none', background: 'transparent', color: '#B39A6E', fontSize: 'clamp(12px, 1.2cqw, 18px)', fontWeight: 800, cursor: 'pointer', lineHeight: 1, padding: 0 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 400, fontSize: 'clamp(11.5px, 1.35cqw, 21px)', color: '#5C4A2E', margin: '0.4em 0 0', lineHeight: 1.4 }}>{text}</p>
        </div>
      )}
    </div>
  );
}
