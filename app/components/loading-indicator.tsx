import { Loader2 } from 'lucide-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNavigation } from 'react-router';
import { useEffect, useState } from 'react';

export function LoadingIndicator() {
  const navigation = useNavigation();
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const [show, setShow] = useState(false);
  const active = navigation.state !== 'idle' || fetching > 0 || mutating > 0;

  useEffect(() => {
    if (active) {
      // Avoid flashing for requests that complete almost instantly while still
      // giving visible feedback for real network activity.
      const timer = window.setTimeout(() => setShow(true), 150);
      return () => clearTimeout(timer);
    }

    setShow(false);
  }, [active]);

  if (!show) return null;

  return (
    <div className="global-loading-indicator" role="status" aria-live="polite">
      <div className="global-loading-progress" aria-hidden="true" />
      <div className="global-loading-message">
        <Loader2 className="global-loading-spinner" aria-hidden="true" />
        <span>
          {navigation.state !== 'idle' ? 'Opening page…' : 'Loading data…'}
        </span>
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  rows = 5,
  label = 'Loading content',
}: Readonly<{ rows?: number; label?: string }>) {
  return (
    <div className="loading-skeleton" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="loading-skeleton-row" key={index} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  cards = 4,
  label = 'Loading summary',
}: Readonly<{ cards?: number; label?: string }>) {
  return (
    <div className="loading-card-grid" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      {Array.from({ length: cards }, (_, index) => (
        <div className="loading-card" key={index} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

// Simple full-page loader for initial loads
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 text-foreground backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Inline loader for components
export function InlineLoader({
  text = 'Loading...',
}: Readonly<{ text?: string }>) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}