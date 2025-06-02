import { Platform, StatusBar, StyleSheet } from 'react-native';
import { colors } from '../constants/Colors';

export const globalStyles = StyleSheet.create({
  // ---- Containers & Layout ----
  screenContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  contentContainer: { // For content within a screen, often with padding
    flex: 1,
    padding: 16, // Default padding, can be overridden
  },
  scrollViewContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ---- Cards ----
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginVertical: 10, // Default vertical margin, can adjust with specific card styles
    marginHorizontal: 6, // Default horizontal margin for cards
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ---- Text ----
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textDefault,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDefault,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 5,
  },
  // ---- Interactive Elements ----
  inputBase: { // Basic styling for TextInput
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: colors.textInput,
    marginBottom: 12, // Default margin, can be overridden
  },
  // Add common button styles, input styles here if you see patterns
  // For example:
  // primaryButton: {
  //   backgroundColor: colors.accent,
  //   paddingVertical: 12,
  //   paddingHorizontal: 20,
  //   borderRadius: 25,
  //   alignItems: 'center',
  // },
  // primaryButtonText: {
  //   color: colors.primaryText,
  //   fontSize: 16,
  //   fontWeight: 'bold',
  // },
});

// You can also export common values like padding, margins, font sizes if needed
export const layout = {
  padding: 16,
  borderRadius: 12,
  // ... other layout constants
}; 