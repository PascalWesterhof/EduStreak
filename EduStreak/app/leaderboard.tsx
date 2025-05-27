import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Text, View, StyleSheet, Button } from "react-native";

export default function Leaderboard() {
    const navigation = useNavigation();

    const onToggle = () =>
    {
        navigation.dispatch(DrawerActions.openDrawer());
    };

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
        backgroundColor: "#25292e",
        }
    });
