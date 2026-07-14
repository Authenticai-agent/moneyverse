'use client';

/**
 * Coach — the mascot speech bubble. Anchored to the top of the stage so it never
 * covers the allocation controls, and dismissible. Re-appears on a new message.
 */

import { useEffect, useState } from 'react';

export default function Coach({ emoji, name, text }: { emoji: string; name: string; text: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [text]); // show again when the message changes
  if (hidden) return null;

  return (
    <div className="absolute left-3 right-3 z-[7] flex justify-center" style={{ top: 96 }}>
      <div style={{ maxWidth: 380, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 38, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))' }}>{emoji}</div>
        <div style={{ background: '#fff', border: '1px solid #E6E0FA', borderRadius: '14px 14px 14px 4px', padding: '10px 12px', boxShadow: '0 14px 30px -14px rgba(60,40,120,.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B4EFF' }}>{name}</span>
            <button type="button" aria-label="Dismiss coach" onClick={() => setHidden(true)} style={{ border: 'none', background: 'transparent', color: '#B4ABCE', fontSize: 13, fontWeight: 800, cursor: 'pointer', lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: '#4B4470', margin: '2px 0 0', lineHeight: 1.4 }}>{text}</p>
        </div>
      </div>
    </div>
  );
}
