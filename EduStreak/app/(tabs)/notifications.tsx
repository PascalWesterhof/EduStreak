import { useNavigation } from "expo-router";
import React from 'react';
import { StyleSheet, Text, View } from "react-native"; // Kept Button import as per your snippet

export default function Notifications() {
    const navigation = useNavigation(); // Kept as per your snippet

    // const onToggle = () => // This was in your snippet but not used to render a button
    // {
    //     navigation.dispatch(DrawerActions.openDrawer());
    // };

  return (
    <View style = {styles.container}>
      <Text style={styles.text}>Notifications</Text>
      {/* If a button to open drawer is needed here, uncomment and adapt from index.tsx */}
    </View>
  );
}

const styles = StyleSheet.create
    ({
        container:
        {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
        },
        text: {
            color: 'white', // Make text visible
            fontSize: 18
        }
    }); 