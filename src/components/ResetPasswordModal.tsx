import React from 'react';
import { supabase } from '../supabaseClient';
import { pushToast } from './Toast';

export function ResetPasswordModal({ onClose }: { onClose: () => void }) {
  const [p1, setP1] = React.useState('');
  const [p2, setP2] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const ok = p1.length >= 6 && p1 === p2;

  const doReset = async () => {
    if (!ok) { pushToast('Passwords must match and be at least 6 characters.'); return; }
    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) { pushToast(error.message || 'Failed to update password'); return; }
      pushToast('Password updated! You are signed in.');
      onClose();
      // Clean the URL in case there are recovery params
      try {
        const hash = window.location.hash || '';
        window.history.replaceState({}, '', location.pathname + (hash.startsWith('#S') ? hash : ''));
      } catch {}
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reset password">
      <div className="modal-panel">
        <h3 style={{ marginTop:0 }}>Set a new password</h3>
        <p className="review-meta" style={{ marginTop:6 }}>
          You opened this from the reset email. Choose a new password below.
        </p>

        <div style={{ display:'grid', gap:8, marginTop:12 }}>
          <input
            className="input"
            type="password"
            placeholder="New password (min 6 chars)"
            value={p1}
            onChange={(e)=>setP1(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={p2}
            onChange={(e)=>setP2(e.target.value)}
          />
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={doReset} disabled={!ok || busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            <button type="button" className="clear-btn" onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}