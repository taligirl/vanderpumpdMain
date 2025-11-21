import React from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { pushToast } from './Toast';

export function TopAuthBar({ user, profile }: { user: any; profile: any }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (user) setOpen(false);
  }, [user]);

  const doLogin = async () => {
    if (!hasSupabaseConfig) {
      pushToast('Add Supabase keys in Integrations to use login.');
      return;
    }
    if (!email || !password) {
      pushToast('Enter email and password.');
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        pushToast(/invalid/i.test(error.message) ? 'Email or password is incorrect.' : error.message);
        return;
      }
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const doSignup = async () => {
    if (!hasSupabaseConfig) {
      pushToast('Add Supabase keys in Integrations to use sign up.');
      return;
    }
    if (!email || !password) {
      pushToast('Enter email and a password (min 6 chars).');
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        const code = (error as any).code;
        if (code === 'user_already_exists') {
          pushToast('That email is already registered. Use Log in or Forgot password.');
        } else {
          pushToast(error.message);
        }
        return;
      }
      pushToast('Account created. Check your email to confirm, then use Log in.');
      setMode('login');
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    if (!hasSupabaseConfig) {
      pushToast('Add Supabase keys in Integrations.');
      return;
    }
    if (!email) {
      pushToast('Enter the email you use for this account.');
      return;
    }
    try {
      setBusy(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) {
        pushToast(error.message);
        return;
      }
      pushToast('Reset email sent. Open it on this device to set a new password.');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  // Logged-out dropdown (login/signup/reset)
  if (!user) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="clear-btn"
          onClick={() => {
            setOpen((o) => !o);
            setMode('login');
          }}
          aria-expanded={open}
        >
          Log in
        </button>

        {open && (
          <div
            className="episode-card"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 300,
              zIndex: 1000,
              background: '#171717',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 12,
            }}
            role="dialog"
            aria-label={
              mode === 'login'
                ? 'Log in'
                : mode === 'signup'
                ? 'Create account'
                : 'Reset password'
            }
          >
            {mode === 'login' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={doLogin} disabled={busy}>
                  {busy ? 'Logging in…' : 'Log in'}
                </button>
                <div
                  className="review-meta"
                  style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}
                >
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setMode('signup')}
                    style={{ padding: 0, border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setMode('reset')}
                    style={{ padding: 0, border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={doSignup} disabled={busy}>
                  {busy ? 'Creating…' : 'Create account'}
                </button>
                <div className="review-meta" style={{ marginTop: 2 }}>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setMode('login')}
                    style={{ padding: 0, border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Already have an account? Back to Log in
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Your account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="button" onClick={doReset} disabled={busy}>
                  {busy ? 'Sending…' : 'Send reset email'}
                </button>
                <div className="review-meta" style={{ marginTop: 2 }}>
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setMode('login')}
                    style={{ padding: 0, border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Back to Log in
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Logged-in state
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid #333',
          background: '#222',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {profile?.avatar ? (
          <img
            alt=""
            src={profile.avatar}
            width={24}
            height={24}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : (
          <span style={{ fontSize: 12, color: '#aaa' }}>👤</span>
        )}
      </div>
      <span className="review-meta" style={{ whiteSpace: 'nowrap' }}>
        {profile?.name || user.email}
      </span>
      <button
        type="button"
        className="clear-btn"
        onClick={async () => {
          await supabase.auth.signOut();
          pushToast('Logged out');
        }}
      >
        Log out
      </button>
    </div>
  );
}
