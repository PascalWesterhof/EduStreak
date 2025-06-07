import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Text, View, StyleSheet, Button, TouchableOpacity } from "react-native";
import { useLayoutEffect } from "react";


export default function Leaderboard() {
    const navigation = useNavigation();

    const onToggle = () =>
    {
        navigation.dispatch(DrawerActions.openDrawer());
    };

 useLayoutEffect(() => {
      navigation.setOptions({
          headerTitleStyle: {
            color: '#000',       // Your desired text color
            fontSize: 20,        // Your desired font size
            fontWeight: 'bold',  // Optional
          },
          headerStyle: {
            backgroundColor: '#fff', // Optional: white background
          },
      headerTintColor: '#D1624A'
        });
      }, [navigation]);


  return (
    <View style = {styles.container}>
      <Text>Leaderboard</Text>
      <Button title="Open drawer" onPress={onToggle}/>
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
        backgroundColor: "#fff",
        }
    });