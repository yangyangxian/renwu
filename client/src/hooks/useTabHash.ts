import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function resolveTabValue<T extends string>(
  tabs: readonly T[],
  defaultTab: T,
  hash: string,
  externalValue?: T
): T {
  if (externalValue !== undefined && tabs.includes(externalValue)) {
    return externalValue;
  }

  const hashTab = hash.replace('#', '') as T;
  return tabs.includes(hashTab) ? hashTab : defaultTab;
}

export function useTabHash<T extends string>(
  tabs: T[],
  defaultTab: T,
  externalValue?: T,
  externalSetter?: (tab: T) => void
): [T, (tab: T) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const value = resolveTabValue(tabs, defaultTab, location.hash, externalValue);

  // Keep the hash as a reflection of controlled state. For uncontrolled tabs,
  // only initialize an invalid/missing hash with the default tab.
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const hasValidHash = tabs.includes(hash as T);
    const shouldSyncHash = externalValue !== undefined || !hasValidHash;
    const targetHash = `#${value}`;

    if (shouldSyncHash && location.hash !== targetHash) {
      navigate({ pathname: location.pathname, search: location.search, hash: targetHash }, { replace: true });
    }
  }, [externalValue, location.hash, location.pathname, location.search, navigate, tabs, value]);

  const handleTabChange = (tab: T) => {
    if (externalSetter) {
      externalSetter(tab);
    }
    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: `#${tab}`,
    }, { replace: true });
  };

  return [value, handleTabChange];
}
