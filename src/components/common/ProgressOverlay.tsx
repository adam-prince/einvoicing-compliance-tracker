import { useEffect } from 'react';

interface Props {
  visible: boolean;
  message: string;
  progress?: number; // 0-100
  onClose?: () => void;
}

export function ProgressOverlay({ visible, message, progress = 0, onClose }: Props) {
  if (!visible) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Progress">
      <div className="modal" style={{ maxWidth: 480 }}>
        <header style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Update in progress</strong>
          {onClose && <button onClick={onClose}>Close</button>}
        </header>
        <div style={{ padding: 16 }}>
          <p style={{ marginTop: 0 }}>{message}</p>
          <div style={{ height: 8, width: '100%', background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }} aria-label="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`, background: '#00d639', transition: 'width 300ms ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
}


