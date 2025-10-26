import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@ngoattendance_theme';

export const ThemeContext = createContext({
  darkMode: false,
  setTheme: () => {},
  lightTheme: {},
  darkTheme: {},
});

const lightTheme = {
  backgroundColors: ['#ffffff', '#cde4fbff'],
  backgroundStart: [0, 0],
  backgroundEnd: [1, 1],
  cardBg: '#ffffff',
  border: '#e0e7ee',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  accent: '#1abc9c',
  header: '#296e9cff',
  iconBg: '#e8f6f3',
  toggleBg: '#ecf0f1',
};

const darkTheme = {
  backgroundColors: ['#122d42ff', '#041728ff'],
  backgroundStart: [0, 0],
  backgroundEnd: [1, 1],
  background: '#091828ff',
  cardBg: '#34495e',
  border: '#546a7b',
  textPrimary: '#ecf0f1',
  textSecondary: '#bdc3c7',
  accent: '#1abc9c',
  header: '#5dadec',
  iconBg: '#34495e',
  toggleBg: '#34495e',
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(THEME_KEY);
        if (!mounted) return;
        if (v === 'dark') setDarkMode(true);
        else if (v === 'light') setDarkMode(false);
      } catch (e) {
        console.warn('Failed to load theme', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setTheme = useCallback(async (value) => {
    try {
      setDarkMode(Boolean(value));
      await AsyncStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setTheme, lightTheme, darkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
