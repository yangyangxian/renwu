import { useCallback, useEffect, useState } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // On mount, set dark mode from localStorage or system preference
  useEffect(() => {
    const html = document.documentElement;
    const stored = localStorage.getItem("theme");
    let dark = false;
    if (stored === "dark") {
      html.classList.add("dark");
      dark = true;
    } else if (stored === "light") {
      html.classList.remove("dark");
      dark = false;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
      dark = true;
    } else {
      html.classList.remove("dark");
      dark = false;
    }
    setIsDark(dark);
  }, []);

  // Toggle dark mode and persist preference
  const toggleDark = useCallback(() => {
    const html = document.documentElement;
    const newDark = !html.classList.contains("dark");
    html.classList.toggle("dark");
    localStorage.setItem("theme", newDark ? "dark" : "light");
    setIsDark(newDark);
  }, []);

  return { isDark, toggleDark };
}
