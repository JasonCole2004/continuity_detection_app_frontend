import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const HIGH_CONTRAST_KEY = "high_contrast_mode";

type ThemeContextType = {
  highContrast: boolean;
  toggleHighContrast: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  highContrast: false,
  toggleHighContrast: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HIGH_CONTRAST_KEY).then((val) => {
      if (val === "true") setHighContrast(true);
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      AsyncStorage.setItem(HIGH_CONTRAST_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const useHCStyles = () => {
  const { highContrast: hc } = useTheme();
  if (!hc) return { bg: {}, card: {}, text: {}, subtext: {}, input: {}, back: {} };
  return {
    bg:      { backgroundColor: "#000000" },
    card:    { backgroundColor: "#1a1a1a" },
    text:    { color: "#ffffff" },
    subtext: { color: "#9ca3af" },
    input:   { backgroundColor: "#1a1a1a", color: "#ffffff" },
    back:    { color: "#60a5fa" },
  };
};
