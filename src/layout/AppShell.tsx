// src/layout/AppShell.tsx
import React from 'react';

type Props = {
  children: React.ReactNode;
  user: any;
  profile: any;
};

/**
 * AppShell — super light wrapper. We can add
 * header/footer or global layout here later.
 */
export default function AppShell({ children, user, profile }: Props) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
