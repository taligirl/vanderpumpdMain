import React from 'react';
import { NotificationsList } from './NotificationsList';

type NotificationsTabProps = {
  userId: string | null;
  setNotifCount: (n: number) => void;
};

export function NotificationsTab({ userId, setNotifCount }: NotificationsTabProps) {
  return (
    <div>
      <NotificationsList userId={userId} onCount={setNotifCount} />
    </div>
  );
}
