import React from 'react';
import { TopAuthBar } from './TopAuthBar';

type MainTopBarProps = {
  tab: string;
  goTab: (next: string) => void;
  notifCount: number | null;
  user: any;
  profile: any;
};

export function MainTopBar({
  tab,
  goTab,
  notifCount,
  user,
  profile,
}: MainTopBarProps) {
  return (
    <div
      className="top-bar"
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 12px',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-xl)',
        position: 'sticky',
        top: 8,
        zIndex: 100,
        background:
          'linear-gradient(180deg, rgba(21,20,36,.92), rgba(21,20,36,.72) 55%, rgba(21,20,36,0))',
        backdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow)',
      }}
      role="navigation"
      aria-label="Top bar"
    >
      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => goTab('browse')}
          className={tab === 'browse' ? 'active' : ''}
          aria-current={tab === 'browse' ? 'page' : undefined}
        >
          Browse
        </button>

        {user && (
          <>
            <button
              type="button"
              onClick={() => goTab('diary')}
              className={tab === 'diary' ? 'active' : ''}
              aria-current={tab === 'diary' ? 'page' : undefined}
            >
              Diary
            </button>
            <button
              type="button"
              onClick={() => goTab('collections')}
              className={tab === 'collections' ? 'active' : ''}
              aria-current={tab === 'collections' ? 'page' : undefined}
            >
              Collections
            </button>
            <button
              type="button"
              onClick={() => goTab('friends')}
              className={tab === 'friends' ? 'active' : ''}
              aria-current={tab === 'friends' ? 'page' : undefined}
            >
              Friends
            </button>
            <button
              type="button"
              onClick={() => goTab('notifications')}
              className={tab === 'notifications' ? 'active' : ''}
              aria-label={`Notifications ${
                notifCount ? `(${notifCount})` : ''
              }`}
              title="Notifications"
            >
              🍸
              {notifCount ? ` (${notifCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => goTab('profile')}
              className={tab === 'profile' ? 'active' : ''}
              aria-current={tab === 'profile' ? 'page' : undefined}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => goTab('settings')}
              className="tab-btn"
              aria-current={tab === 'settings' ? 'page' : undefined}
            >
              Settings
            </button>
          </>
        )}

        <TopAuthBar user={user} profile={profile} />
      </div>

      {/* "Please log in" card for locked tabs */}
      {!user && tab !== 'browse' && (
        <div className="episode-card" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Please log in</h3>
          <p className="review-meta" style={{ marginTop: 6 }}>
            Please create an account or log in from the top-right to use this
            section!
          </p>
        </div>
      )}
    </div>
  );
}