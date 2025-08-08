import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export function useTabHash<T extends string>(
  tabs: T[],
  defaultTab: T,
  externalValue?: T,
  externalSetter?: (tab: T) => void
): [T, (tab: T) => void] {
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    return tabs.includes(hash as T) ? (hash as T) : defaultTab;
  };

  const [activeTab, setActiveTab] = useState<T>(getInitialTab());

  // Only force defaultTab if there is no valid hash in the URL
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const hasValidHash = tabs.includes(hash as T);
    const targetHash = `#${defaultTab}`;
    // Only update if the current tab/hash is not already the default
    if (!hasValidHash && tabs.includes(defaultTab)) {
      // Only update state if needed
      if ((externalValue ?? activeTab) !== defaultTab) {
        if (externalSetter) {
          externalSetter(defaultTab);
        } else {
          setActiveTab(defaultTab);
        }
      }
      // Only navigate if the hash is not already set to defaultTab
      if (location.hash !== targetHash) {
        navigate({ pathname: location.pathname, search: location.search, hash: targetHash }, { replace: true });
      }
    }
  }, [defaultTab, tabs, externalSetter, externalValue, activeTab, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (tabs.includes(hash as T)) {
        if (externalSetter) {
          externalSetter(hash as T);
        } else {
          setActiveTab(hash as T);
        }
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [tabs, externalSetter]);

  const handleTabChange = (tab: T) => {
    if (externalSetter) {
      externalSetter(tab);
    } else {
      setActiveTab(tab);
    }
    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: `#${tab}`,
    }, { replace: true });
  };

  // If controlled, use externalValue; else use local state
  const value = externalValue !== undefined ? externalValue : activeTab;

  return [value, handleTabChange];
}
