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

  // defaultTab may change when the selected task view changes
  useEffect(() => {
    if (tabs.includes(defaultTab)) {
      if (externalSetter) {
        externalSetter(defaultTab);
      } else {
        setActiveTab(defaultTab);
      }
    }
  }, [defaultTab]);

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
