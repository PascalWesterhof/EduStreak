import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Pressable
} from "react-native";
import React, { useLayoutEffect, useMemo } from "react"; // useState verwijderd, useMemo toegevoegd
import { useNavigation } from "expo-router"; // DrawerActions verwijderd, niet gebruikt
import { useFonts } from "expo-font";
import { useTheme } from "../functions/themeFunctions/themeContext"; // << PAS PAD AAN
import { ColorScheme } from "../functions/themeFunctions/themeContext"; // << PAS PAD AAN

const getStyles = (colors: ColorScheme, fontsLoaded: boolean, DMSansSemiBold: string | undefined, RubikMedium: string | undefined) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Gebruik themakleur
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignSelf: "center",
    marginVertical: 20,
  },
  headerText: {
    fontFamily: fontsLoaded ? DMSansSemiBold : undefined,
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text, // Gebruik themakleur
  },
  box: {
    backgroundColor: colors.cardBackground, // Gebruik themakleur, bv. cardBackground of inputBackground
    borderRadius: 8, // Iets ronder misschien?
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderColor, // Een subtiele border
  },
  label: {
    fontFamily: fontsLoaded ? RubikMedium : undefined,
    fontSize: 16,
    color: colors.textDefault, // Gebruik themakleur
  },
  selectedLabel: { // Stijl voor de geselecteerde optie
    fontFamily: fontsLoaded ? RubikMedium : undefined,
    fontSize: 16,
    color: colors.primary, // Markeer met primaire kleur
    fontWeight: 'bold',
  },
});

export default function Appearance() {
  const [fontsLoaded, fontError] = useFonts({
      "DMSans-SemiBold": require("../assets/fonts/DMSans-SemiBold.ttf"),
      "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    });

    const navigation = useNavigation();
    const { colors: themeColors, themeMode, setThemeMode: applyTheme } = useTheme(); // << GEBRUIK useTheme

    // Genereer stijlen gebaseerd op het huidige thema en lettertype status
    const styles = useMemo(() => getStyles(
      themeColors,
      fontsLoaded && !fontError, // Zorg ervoor dat fonts echt geladen zijn zonder error
      "DMSans-SemiBold",
      "Rubik-Medium"
    ), [themeColors, fontsLoaded, fontError]);


  useLayoutEffect(() => {
    if (fontsLoaded && !fontError) {
         navigation.setOptions({
           headerTitleStyle: {
             fontFamily: "DMSans-SemiBold",
             color: themeColors.text, // Gebruik themakleur uit context
           },
           headerStyle: {
             backgroundColor: themeColors.headerBackground, // Gebruik themakleur uit context
           },
           headerTintColor: themeColors.text, // Gebruik themakleur uit context
         });
       }
     }, [navigation, fontsLoaded, fontError, themeColors]);

     if (!fontsLoaded && !fontError) { // Wacht tot fonts geladen zijn of er een error is
       return null; // Of een ActivityIndicator
     }
     if (fontError) {
       console.error("Font loading error:", fontError);
       // Je kunt hier een fallback UI tonen of de app zonder custom fonts laten renderen
     }

  return (
    <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Appearance</Text>
          </View>

          <Pressable onPress={() => applyTheme("light")}>
            <View style={[styles.box, themeMode === 'light' && { borderColor: themeColors.primary, backgroundColor: themeColors.backgroundVariant }]}>
              <Text style={themeMode === 'light' ? styles.selectedLabel : styles.label}>Light</Text>
              {/* Optioneel: voeg een icoontje toe voor de geselecteerde state */}
              {themeMode === 'light' && <Text style={{ color: themeColors.primary }}>✓</Text>}
            </View>
          </Pressable>

          <Pressable onPress={() => applyTheme("dark")}>
            <View style={[styles.box, themeMode === 'dark' && { borderColor: themeColors.primary, backgroundColor: themeColors.backgroundVariant }]}>
              <Text style={themeMode === 'dark' ? styles.selectedLabel : styles.label}>Dark</Text>
              {themeMode === 'dark' && <Text style={{ color: themeColors.primary }}>✓</Text>}
            </View>
          </Pressable>
        </SafeAreaView>
      );
    }
