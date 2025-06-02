/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const colors = {
  primary: '#D05B52',        // Main background color from Calendar screen
  primaryText: '#FFFFFF',   // Text color on primary background
  accent: '#D9534F',         // Accent color (streaks, loader in Calendar)
  cardBackground: '#FFFFFF', // Background for cards
  textDefault: '#333333',     // Default dark text
  textSecondary: '#555555',   // Secondary dark text
  textMuted: '#888888',       // Muted text (like attribution)
  error: 'red',              // Error text color
  inputBackground: '#F0F0F0', // Background for text inputs
  inputBorder: '#D0D0D0',     // Border for text inputs
  textInput: '#333333',       // Text color inside inputs
  placeholderText: '#A9A9A9', // Placeholder text color (was mediumGray)
  white: '#FFFFFF',          // Explicit white for text on colored backgrounds
  lightGray: '#F5F5F5',      // Used for inputs in edit-habit
  mediumGray: '#A9A9A9',     // Placeholder text in edit-habit
  darkGray: '#666666',       // Quote author in calendar
  black: '#000000',
  borderColor: '#E0E0E0',
  unreadItemBackground: '#E8F0FE', // For unread notification items
  // Specific to calendar for now, could be generalized
  calendarAccent: '#c44',      // Accent color in calendar view (month, day, etc.)
};
