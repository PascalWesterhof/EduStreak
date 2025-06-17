// In constants/Colors.ts

    const tintColorLight = '#0a7ea4';
    const tintColorDark = '#fff';

    // Definieer hier je ColorScheme interface, zoals eerder besproken
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
        // Bestaande light mode kleuren
        text: '#11181C',
        background: '#FFFFFF', // Wit
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,

        // Toevoegingen van 'colors' voor light mode
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
        // Bestaande dark mode kleuren
        text: '#ECEDEE',
        background: '#121212',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,

        // Dark mode equivalenten
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

export const authScreenFixedColors: ColorScheme = {
      background: '#FFFFFF',
      text: '#11181C',
      textDefault: '#333333',
      textSecondary: '#555555',
      textMuted: '#888888',
      primary: '#D05B52', // Je bestaande primary
      primaryText: '#FFFFFF',
      accent: '#D9534F',
      cardBackground: '#F8F8F8', // Als je kaarten zou gebruiken
      error: 'red',
      inputBackground: '#F0F0F0',
      inputBorder: '#D0D0D0',
      textInput: '#333333',
      placeholderText: '#A9A9A9',
      borderColor: '#E0E0E0',
      white: '#FFFFFF', // Expliciet wit
      black: '#000000', // Expliciet zwart
      // Vul alle andere properties van ColorScheme in die je nodig hebt voor auth-schermen
      tint: '#0a7ea4', // Bijvoorbeeld je light tint
      icon: '#687076',
      tabIconDefault: '#687076', // Waarschijnlijk niet relevant voor auth-schermen
      tabIconSelected: '#0a7ea4', // Waarschijnlijk niet relevant
      unreadItemBackground: '#E8F0FE', // Waarschijnlijk niet relevant
      calendarAccent: '#c44', // Waarschijnlijk niet relevant
      shadow: '#000000',
      headerBackground: '#FFFFFF',
    };