import { useState, useEffect } from 'react';

/**
 * Returns true after the component has mounted on the client.
 * Use this to guard browser-only rendering and avoid SSR hydration mismatches.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
