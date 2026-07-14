'use client';

/** Coach — the mascot speech bubble. Presentational. */

export default function Coach({
  emoji,
  name,
  text,
  onDismiss,
}: {
  emoji: string;
  name: string;
  text: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="absolute left-3 right-3 z-[7]" style={{ bottom: 232, maxWidth: 340, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ fontSize: 40, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))' }}>{emoji}</div>
      <div style={{ background: '#fff', border: '1px solid #E6E0FA', borderRadius: '14px 14px 14px 4px', padding: '10px 12px', boxShadow: '0 12px 26px -14px rgba(60,40,120,.5)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B4EFF', marginBottom: 2 }}>{name}</div>
        <p style={{ fontSize: 12.5, color: '#4B4470', margin: 0, lineHeight: 1.4 }}>{text}</p>
        {onDismiss && (
          <button type="button" onClick={onDismiss} style={{ marginTop: 6, border: 'none', background: 'transparent', color: '#A8A2C0', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
            got it ✕
          </button>
        )}
      </div>
    </div>
  );
}
