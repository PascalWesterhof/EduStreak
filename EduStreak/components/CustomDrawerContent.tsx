import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { useRouter } from 'expo-router'; // Voor navigatie na logout
import { signOut } from 'firebase/auth';
import React, { useMemo } from 'react'; // Importeer useMemo
import { Alert, StyleSheet, Text, View } from "react-native";
import { auth } from '../config/firebase';
import { ColorScheme, useTheme } from '../functions/themeFunctions/themeContext'; // << NIEUW: Importeer useTheme

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  contentScrollView: {
    flex: 1,
    // De achtergrondkleur komt nu van de Drawer.Navigator's drawerStyle
    // of je kunt het hier expliciet instellen als je een andere kleur wilt dan de Drawer zelf:
    // backgroundColor: colors.backgroundDrawer, // Als je een specifieke 'backgroundDrawer' kleur hebt
  },
  headerContainer: { // Optioneel: voor een custom header binnen de drawer
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor, // Gebruik themakleur
    marginBottom: 10,
  },
  headerText: { // Optioneel
    color: colors.text, // Gebruik themakleur
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutItem: { // Stijl voor het View omhulsel van het logout item
    // backgroundColor: colors.error, // Voorbeeld: als je een achtergrondkleur wilt
    marginTop: 20,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  logoutLabel: { // Stijl specifiek voor de tekst van het logout item
    color: colors.text, // Als 'white' is gedefinieerd in je ColorScheme
    fontWeight: 'bold',
  },
  // Je kunt hier meer stijlen toevoegen als nodig
});

export default function CustomDrawerContent(props: any) {
    const { colors: themeColors } = useTheme(); // << NIEUW: Haal themakleuren op
    const router = useRouter();

    // Genereer de stijlen met de huidige themakleuren
    // useMemo zorgt ervoor dat styles alleen opnieuw worden berekend als themeColors verandert
    const styles = useMemo(() => getStyles(themeColors), [themeColors]);

    const handleLogout = async () => {
        try {
          await signOut(auth);
          props.navigation.closeDrawer(); // Sluit de drawer
          router.replace('/auth/LoginScreen'); // Navigeer naar login
        } catch (error: any) {
          console.error("Logout Error: ", error);
          Alert.alert('Logout Failed', error.message);
        }
    };

    return (
        <DrawerContentScrollView
            {...props}
            style={styles.contentScrollView} // Gebruik dynamische stijl
            // Je kunt de achtergrond ook direct hier instellen als je dat prefereert boven drawerStyle in de Navigator:
            // contentContainerStyle={{ backgroundColor: themeColors.background }}
        >
            {/* Optionele custom header */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>EduStreak</Text>
            </View>

            {/* Dit rendert de standaard items (Home, Calendar, etc.)
                De styling hiervan komt van de screenOptions in je Drawer.Navigator */}
            <DrawerItemList {...props} />

            {/* Aangepast "Log Out" item */}
            <DrawerItem
                label={"Log Out"}
                onPress={handleLogout}
                style={styles.logoutItem}         // Stijl voor het item container
                labelStyle={styles.logoutLabel}   // Stijl voor de tekst
                // Als je een icoon hebt:
                // icon={({ size }) => <SomeIcon name="logout" color={'#FFFFFF'} size={size} />}
            />
        </DrawerContentScrollView>
    );
}