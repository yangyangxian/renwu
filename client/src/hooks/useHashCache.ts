import { useRef } from 'react';

/**
 * useHashCache
 * A generic hook for caching keys (e.g., successful lookups, valid values).
 *
 * @returns {
 *   has: (key: T) => boolean,
 *   add: (key: T) => void,
 *   remove: (key: T) => void,
 *   clear: () => void,
 *   values: () => T[]
 * }
 */
export function useHashCache<T = string>() {
  const cache = useRef<Set<T>>(new Set());

  const has = (key: T) => cache.current.has(key);
  const add = (key: T) => cache.current.add(key);
  const remove = (key: T) => cache.current.delete(key);
  const clear = () => cache.current.clear();
  const values = () => Array.from(cache.current);

  return { has, add, remove, clear, values };
}
