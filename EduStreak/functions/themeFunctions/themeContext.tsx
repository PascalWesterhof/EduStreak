// functions/themeFunctions/themeContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';
import { AppThemeColors, ColorScheme as AppColorScheme } from '../../constants/Colors';

// 1. Definieer de structuur van je kleurenschema
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
    colors: AppColorScheme; // Deze 'colors' prop in initialTheme wordt momenteel niet direct gebruikt
                           // omdat we AppThemeColors[resolvedInitialMode] gebruiken, maar is goed voor compleetheid.
    isDark: boolean;
  };
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => { // << CORRECTIE 1: initialTheme hier
//                                          ^^^^^^^^^^^^
  const systemScheme = Appearance.getColorScheme(); // << CORRECTIE 2: Definieer systemScheme hier

  const defaultInitialMode = systemScheme || 'light';
  const resolvedInitialMode = initialTheme?.themeMode || defaultInitialMode;

  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(resolvedInitialMode);

  useEffect(() => {
    // Deze listener zal de `themeMode` nog steeds bijwerken als het systeemthema verandert.
    // Dit kan de `initialTheme` of een handmatige keuze overschrijven.
    // Voor een robuustere oplossing, overweeg AsyncStorage en geef gebruikerskeuze prioriteit.
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setThemeModeState(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setThemeModeState(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      // TODO: Sla newMode op in AsyncStorage
      return newMode;
    });
  };

   const setThemeMode = (mode: 'light' | 'dark') => {
      setThemeModeState(mode);
      // TODO: Sla mode op in AsyncStorage
    };

    const currentColors = AppThemeColors[themeMode];
    const isDark = themeMode === 'dark'; // << Zorg dat deze is gedefinieerd

    if (!currentColors) {
      console.error("ThemeProvider Error: currentColors is undefined! themeMode was:", themeMode, ". Falling back to light.");
      return (
        <ThemeContext.Provider value={{
          themeMode: 'light',
          colors: AppThemeColors.light, // Fallback colors
          toggleTheme,
          setThemeMode,
          isDark: false // << CORRECTIE 3a: isDark in fallback
        }}>
          {children}
        </ThemeContext.Provider>
      );
    }



return (
    <ThemeContext.Provider value={{
      themeMode,
      colors: currentColors, // << CORRECTIE 3b: Gebruik currentColors (was colorsToUse)
      toggleTheme,
      setThemeMode,
      isDark // << CORRECTIE 3c: Voeg isDark toe aan de context value
    }}>
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