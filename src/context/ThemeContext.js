import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();
// Only written when a visitor taps the theme button to a theme different from
// their phone's; otherwise the site follows the phone's light/dark setting.
const THEME_STORAGE_KEY = "sahumario_theme_v3";
// Older keys saved "dark" for every first visit, so they say nothing about
// what the visitor wants; they are cleared and the phone's setting is used.
const OLD_THEME_KEYS = ["sahumario_theme_v2"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

function phoneTheme() {
  try {
    return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function savedTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

// Set before the first render so the page never flashes the other theme.
document.documentElement.setAttribute("data-theme", savedTheme() || phoneTheme());

export function ThemeProvider({ children }) {
  const [phone, setPhone] = useState(phoneTheme);
  const [chosen, setChosen] = useState(savedTheme);
  const theme = chosen || phone;

  // Follow the phone when it switches, e.g. automatic dark mode at sunset.
  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return undefined;
    const onChange = () => setPhone(media.matches ? "dark" : "light");
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener?.(onChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener?.(onChange);
    };
  }, []);

  useEffect(() => {
    try {
      OLD_THEME_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Remembers the tapped theme; tapping back to the phone's theme forgets it,
  // so the site follows the phone again.
  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    const choice = next === phone ? null : next;
    setChosen(choice);
    try {
      if (choice) localStorage.setItem(THEME_STORAGE_KEY, choice);
      else localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      // Ignore write errors in restricted environments.
    }
  }, [theme, phone]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
