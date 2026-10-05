'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useProgressStore, useReadingSettingsStore } from '@/lib/store';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    void useProgressStore.persist.rehydrate();
    void useReadingSettingsStore.persist.rehydrate();

    // Initial check
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setCollapsed(isCollapsed);

    // Create an observer or listen to a custom event if we want perfectly synced animation,
    // but a simple interval or storage listener works for now.
    // Better yet, we can monkey-patch localStorage or dispatch a custom event from Sidebar.
    const handleStorageChange = () => {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-window updates
    const handleCustomEvent = () => handleStorageChange();
    window.addEventListener('sidebar-toggle', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleCustomEvent);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen sidebar-transition pt-12 md:pt-0', // pt-12 for mobile top bar
        collapsed ? 'md:ml-[68px]' : 'md:ml-64'
      )}
    >
      {children}
    </div>
  );
}
