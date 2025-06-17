// globalStyles.ts (thematiseerbare versie)
    import { Platform, StatusBar, StyleSheet } from 'react-native';
    import { ColorScheme } from '../../constants/Colors.ts'; // Importeer je ColorScheme type

    export const getGlobalStyles = (colors: ColorScheme) => StyleSheet.create({
      screenContainer: {
        flex: 1,
        backgroundColor: colors.primary, // Gebruikt nu de thematische kleuren
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
      },
      contentContainer: {
        flex: 1,
        padding: 16,
      },
      centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background, // Voeg thematische achtergrond toe indien nodig
      },
      card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 6,
        shadowColor: colors.shadow || colors.textDefault, // Gebruik thematische schaduw
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.textDefault, // Of colors.text afhankelijk van je definitie
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
      inputBase: {
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: colors.textInput,
        marginBottom: 12,
      },
    });

    // layout blijft waarschijnlijk statisch, tenzij padding/borderRadius ook thematisch moet zijn.
    export const layout = {
      padding: 16,
      borderRadius: 12,
    };