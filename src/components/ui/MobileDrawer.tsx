'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right'; // default 'left'
  width?: string; // Tailwind width class, default 'w-72'
  className?: string;
  'aria-label'?: string;
}

/**
 * MobileDrawer
 * 
 * A slide-over drawer that enters from the left (or right) edge.
 * Renders into document.body using a React portal.
 * Features:
 * - 250ms cubic-bezier slide & fade transitions
 * - Backdrop overlay using the project's 'backdrop-overlay' class
 * - Body scroll lock while open
 * - Escape key dismissal & backdrop click dismissal
 * - Focus trapping and focus restoration for accessibility
 */
export function MobileDrawer({
  isOpen,
  onClose,
  children,
  side = 'left',
  width = 'w-72',
  className,
  'aria-label': ariaLabel = 'Mobile navigation drawer',
}: MobileDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Client-side mount check for React portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle slide-in and slide-out transitions + DOM mounting
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    let rafId: number | undefined;

    if (isOpen) {
      setIsRendered(true);
      // Wait two animation frames to guarantee initial off-screen styles render before transitioning
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Keep rendered in DOM during 250ms exit transition, then unmount
      timeoutId = setTimeout(() => {
        setIsRendered(false);
      }, 250);
    }

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const hadOverflowHidden = document.body.classList.contains('overflow-hidden');
    if (!hadOverflowHidden) {
      document.body.classList.add('overflow-hidden');
    }

    return () => {
      if (!hadOverflowHidden) {
        document.body.classList.remove('overflow-hidden');
      }
    };
  }, [isOpen]);

  // Focus management & keyboard shortcuts (Escape and Tab focus trap)
  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus prior to opening
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside drawer, or fallback to drawer container
    const focusTimeout = setTimeout(() => {
      if (drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Trap Tab focus inside the drawer
      if (event.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previous active element on drawer close
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Do not render anything server-side or when completely closed
  if (!mounted || !isRendered) {
    return null;
  }

  const isLeft = side === 'left';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={cn('fixed inset-0 z-50', !isVisible && 'pointer-events-none')}
    >
      {/* Semi-transparent backdrop overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 backdrop-overlay transition-opacity duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Drawer slide-over panel */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cn(
          'fixed top-0 bottom-0 z-10 flex flex-col h-full h-dvh max-w-[90vw] overflow-y-auto overscroll-contain bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--foreground))] shadow-2xl transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] outline-none',
          isLeft
            ? 'left-0 border-r border-[hsl(var(--sidebar-border))]'
            : 'right-0 border-l border-[hsl(var(--sidebar-border))]',
          width,
          isLeft
            ? isVisible
              ? 'translate-x-0'
              : '-translate-x-full'
            : isVisible
              ? 'translate-x-0'
              : 'translate-x-full',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default MobileDrawer;
