import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Pressable
} from "react-native";
import React, { useLayoutEffect, useMemo } from "react";
import { useNavigation } from "expo-router";
import { useFonts } from "expo-font";
import { useTheme } from "../functions/themeFunctions/themeContext";
import { ColorScheme } from "../constants/Colors";

const getStyles = (colors: ColorScheme, fontsLoaded: boolean, DMSansSemiBold: string | undefined, RubikMedium: string | undefined) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  box: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  label: {
    fontFamily: fontsLoaded ? RubikMedium : undefined,
    fontSize: 16,
    color: colors.textDefault,
  },
  selectedLabel: {
    fontFamily: fontsLoaded ? RubikMedium : undefined,
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default function Appearance() {
  const [fontsLoaded, fontError] = useFonts({
      "DMSans-SemiBold": require("../assets/fonts/DMSans-SemiBold.ttf"),
      "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    });

    const navigation = useNavigation();
    const { colors: themeColors, themeMode, setThemeMode: applyTheme } = useTheme();

    const styles = useMemo(() => getStyles(
      themeColors,
      fontsLoaded && !fontError,
      "DMSans-SemiBold",
      "Rubik-Medium"
    ), [themeColors, fontsLoaded, fontError]);


  useLayoutEffect(() => {
    if (fontsLoaded && !fontError) {
         navigation.setOptions({
           headerTitleStyle: {
             fontFamily: "DMSans-SemiBold",
             color: themeColors.text,
           },
           headerStyle: {
             backgroundColor: themeColors.headerBackground,
           },
           headerTintColor: themeColors.text,
         });
       }
     }, [navigation, fontsLoaded, fontError, themeColors]);

     if (!fontsLoaded && !fontError) {
       return null;
     }
     if (fontError) {
       console.error("Font loading error:", fontError);
     }

  return (
    <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Appearance</Text>
          </View>

          <Pressable onPress={() => applyTheme("light")}>
            <View style={[styles.box, themeMode === 'light' && { borderColor: themeColors.primary, backgroundColor: themeColors.backgroundVariant }]}>
              <Text style={themeMode === 'light' ? styles.selectedLabel : styles.label}>Light</Text>
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
