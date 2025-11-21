import React from 'react';
import { hasSupabaseConfig } from '../supabaseClient';
import { FriendsFeed, FeedModeSwitch } from './FriendsFeed';

export function FriendsTab() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Latest reviews</h3>
        <FeedModeSwitch />
      </div>
      {!hasSupabaseConfig ? (
        <p className="review-meta">
          Connect Supabase and log in to see your feed.
        </p>
      ) : (
        <FriendsFeed />
      )}
    </div>
  );
}
