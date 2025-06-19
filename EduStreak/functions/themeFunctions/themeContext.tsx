import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';
import { AppThemeColors, ColorScheme as AppColorScheme } from '../../constants/Colors';

// Defines the structure of the color scheme
interface ThemeContextData {
  themeMode: 'light' | 'dark';
  colors: AppColorScheme;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextData | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: {
    themeMode: 'light' | 'dark';
    colors: AppColorScheme;
    isDark: boolean;
  };
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
  // Get the current system color scheme (e.g., 'light', 'dark', or null).
  const systemScheme = Appearance.getColorScheme();

  // Set the initial mode for the app to 'light' regardless of system settings or initialTheme prop.
  const resolvedInitialMode: 'light' | 'dark' = 'light';

  // Initialize the themeMode state. It will start as 'light'.
    const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(resolvedInitialMode);

 useEffect(() => {
    // Listens for system theme changes and update the app's theme accordingly.
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // If the system theme changes, update the app's theme.
      // Fallback to 'light' if the new system scheme is undefined.
      setThemeModeState(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

   // Function to toggle between light and dark mode
    const toggleTheme = () => {
      setThemeModeState(prevMode => {
        const newMode = prevMode === 'light' ? 'dark' : 'light';
        return newMode;
      });
    };

const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  };

  // Determine the current color set based on the themeMode
  const currentColors = AppThemeColors[themeMode];
  // Determine if the current mode is dark
  const isDark = themeMode === 'dark';

 // Fallback logic: If currentColors are somehow undefined (e.g., themeMode is an invalid value)
  // provide a default safe theme context.
  if (!currentColors) {
    console.error(
      "ThemeProvider Error: currentColors is undefined! themeMode was:",
      themeMode,
      ". Falling back to light theme."
    );
    return (
      <ThemeContext.Provider
        value={{
          themeMode: 'light',
          colors: AppThemeColors.light,
          toggleTheme,
          setThemeMode,
          isDark: false,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  // Provide the theme context to children
  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colors: currentColors,
        toggleTheme,
        setThemeMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};