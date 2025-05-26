import React from 'react';
import { StyleSheet, Text, View } from "react-native";

export default function Calendar() {
    return (
         <View
              style = {styles.container}
            >
              <Text style={styles.text}>Calendar</Text>
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
        },
        text: {
            color: 'white',
            fontSize: 18
        }
    }); 