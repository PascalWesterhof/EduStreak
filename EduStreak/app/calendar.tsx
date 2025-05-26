import { Text, View, StyleSheet } from "react-native";

export default function Calendar() {
    return (
         <View
              style = {styles.container}
            >
              <Text>Calendar</Text>
            </View>
        );
    };

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