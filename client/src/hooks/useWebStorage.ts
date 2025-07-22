import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * useWebStorageState - a generic hook for persistent state with localStorage or sessionStorage, with optional expiration.
 *
 * @param key - unique key for localStorage
 * @param initialValue - initial value if nothing in storage
 * @param options - { expireMs?: number, storageType?: 'local' | 'session' } (optional expiration in ms, and storage type)
 * @returns [value, setValue, { expired }]
 */
export function useWebStorage<T = string>(
  key: string | null,
  initialValue: T,
  options?: { expireMs?: number; storageType?: 'local' | 'session' }
): [T, Dispatch<SetStateAction<T>>, { expired: boolean; remove: () => void }] {
  const expireMs = options?.expireMs;
  const storageType = options?.storageType || 'local';
  const storage = typeof window === 'undefined'
    ? undefined
    : storageType === 'session'
      ? window.sessionStorage
      : window.localStorage;
  const [expired, setExpired] = useState(false);

  const getStored = (): T => {
    if (!storage || !key) return initialValue;
    const raw = storage.getItem(key);
    if (!raw) return initialValue;
    try {
      const obj = JSON.parse(raw);
      if (typeof obj === "object" && obj.value !== undefined && obj.timestamp && expireMs) {
        if (Date.now() - obj.timestamp < expireMs) {
          setExpired(false);
          return obj.value;
        } else {
          storage.removeItem(key);
          setExpired(true);
          return initialValue;
        }
      }
      // fallback: treat as plain string (legacy)
      setExpired(false);
      return obj.value !== undefined ? obj.value : initialValue;
    } catch {
      setExpired(false);
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(getStored);

  // Sync with localStorage on mount/when key changes
  useEffect(() => {
    setValue(getStored());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storageType]);

  // Persist to localStorage
  useEffect(() => {
    if (!storage || !key) return;
    if (value === initialValue) {
      storage.removeItem(key);
    } else {
      const obj = expireMs
        ? { value, timestamp: Date.now() }
        : { value };
      storage.setItem(key, JSON.stringify(obj));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key, expireMs, storageType]);

  const remove = () => {
    if (storage && key) {
      storage.removeItem(key);
    }
  };

  return [value, setValue, { expired, remove }];
}
