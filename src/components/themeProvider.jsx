import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);

  // Carica il tema da onboarding.json all'avvio
  useEffect(() => {
    async function fetchTheme() {
      const onboarding = await window.electron.invoke("get-onboarding-data");
      setDark(!!onboarding?.dark);
      if (onboarding?.dark) {
        document.body.className = "dark";
      } else {
        document.body.className = "";
      }
    }
    fetchTheme();
  }, []);

  // Cambia tema e aggiorna onboarding.json + body
  const toggleTheme = useCallback(async (newDark) => {
    setDark(newDark);
    const onboarding = await window.electron.invoke("get-onboarding-data");
    await window.electron.invoke("set-onboarding-data", { ...onboarding, dark: newDark });
    if (newDark) {
      document.body.className = "dark";
    } else {
      document.body.className = "";
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}