import { useState, useLayoutEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Returns 'light' on initial render (matching server SSR), then syncs to the actual system
 * color scheme via useLayoutEffect before paint — preventing hydration mismatches.
 */
export function useColorScheme() {
  const rnScheme = useRNColorScheme();
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');

  useLayoutEffect(() => {
    setScheme(rnScheme ?? 'light'); // eslint-disable-line react-hooks/set-state-in-effect
  }, [rnScheme]);

  return scheme;
}
