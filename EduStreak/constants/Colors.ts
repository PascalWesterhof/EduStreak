    const tintColorLight = '#0a7ea4';
    const tintColorDark = '#fff';


    export interface ColorScheme {
      text: string;
      background: string;
      tint: string;
      icon: string;
      tabIconDefault: string;
      tabIconSelected: string;
      primary: string;
      primaryText: string;
      accent: string;
      cardBackground: string;
      textDefault: string;
      textSecondary: string;
      textMuted: string;
      error: string;
      inputBackground: string;
      inputBorder: string;
      textInput: string;
      placeholderText: string;
      borderColor: string;
      unreadItemBackground: string;
      calendarAccent: string;
      shadow: string;
      headerBackground: string;
      white: string;
      black: string;
      progressBackground: string;
    }

    export const AppThemeColors: { light: ColorScheme, dark: ColorScheme } = {
      light: {
        // Colors for Light mode
        text: '#11181C',
        background: '#FFFFFF',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
        primary: '#D05B52',
        primaryText: '#FFFFFF',
        accent: '#D9534F',
        cardBackground: '#F8F8F8',
        textDefault: '#333333',
        textSecondary: '#555555',
        textMuted: '#888888',
        error: 'red',
        inputBackground: '#F0F0F0',
        inputBorder: '#D0D0D0',
        textInput: '#333333',
        placeholderText: '#A9A9A9',
        borderColor: '#E0E0E0',
        unreadItemBackground: '#E8F0FE',
        calendarAccent: '#c44',
        shadow: '#000000',
        headerBackground: '#FFFFFF',
        white: '#FFFFFF',
        black: '#000000',
        progressBackground: '#E0E0E0',
      },
      dark: {
        // Colors for Dark mode
        text: '#ECEDEE',
        background: '#121212',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,

        primary: '#E57373',
        primaryText: '#000000',
        accent: '#D9534F',
        cardBackground: '#1E1E1E',
        textDefault: '#ECEDEE',
        textSecondary: '#B0B3B8',
        textMuted: '#8A8D91',
        error: '#FF8A80',
        inputBackground: '#2C2F33',
        inputBorder: '#505152',
        textInput: '#ECEDEE',
        placeholderText: '#767676',
        borderColor: '#404040',
        unreadItemBackground: '#2A3B4D',
        calendarAccent: '#ff6666',
        shadow: 'rgba(255, 255, 255, 0.1)',
        headerBackground: '#1E1E1E',
        white: '#FFFFFF',
        black: '#000000',
        progressBackground: '#424242',
      },
    };

// Colors for standard Light mode, this makes it so the pages with these colors will always stay on light mode
export const authScreenFixedColors: ColorScheme = {
      background: '#FFFFFF',
      text: '#11181C',
      textDefault: '#333333',
      textSecondary: '#555555',
      textMuted: '#888888',
      primary: '#D05B52',
      primaryText: '#FFFFFF',
      accent: '#D9534F',
      cardBackground: '#F8F8F8',
      error: 'red',
      inputBackground: '#F0F0F0',
      inputBorder: '#D0D0D0',
      textInput: '#333333',
      placeholderText: '#A9A9A9',
      borderColor: '#E0E0E0',
      white: '#FFFFFF',
      black: '#000000',
      tint: '#0a7ea4',
      icon: '#687076',
      tabIconDefault: '#687076',
      tabIconSelected: '#0a7ea4',
      unreadItemBackground: '#E8F0FE',
      calendarAccent: '#c44',
      shadow: '#000000',
      headerBackground: '#FFFFFF',
    };