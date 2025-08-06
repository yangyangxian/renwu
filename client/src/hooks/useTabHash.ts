import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export function useTabHash<T extends string>(tabs: T[], defaultTab: T): [T, (tab: T) => void] {
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
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (tabs.includes(hash as T)) setActiveTab(hash as T);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [tabs]);

  const handleTabChange = (tab: T) => {
    setActiveTab(tab);
    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: `#${tab}`,
    }, { replace: true });
  };

  return [activeTab, handleTabChange];
}
