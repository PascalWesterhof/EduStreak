import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable } from "react-native";
import React, { useState } from 'react';
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { useFonts } from "expo-font";

export default function Gamification()
{
        const [fontsLoaded] = useFonts({
          'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
          'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
          });      const navigation = useNavigation();

        const onToggle = () =>
        {
            navigation.dispatch(DrawerActions.openDrawer());
        };
          useLayoutEffect(() => {
              if(fontsLoaded) {
                navigation.setOptions({
                    headerTitleStyle: {
                        fontFamily: 'DMSans-SemiBold',
                        color: '#fff',
                    },
                    headerStyle: {
                      backgroundColor: '#D1624A', // Optional: white background
                    },
                 headerTintColor: '#fff'
                  });
                }
            }, [navigation, fontsLoaded]);

        if(!fontsLoaded){
            return null;
            }

            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                    <Text style={styles.headerText}>Appearance</Text>
                    </View>
                    <View style={styles.box}>
                   <Text style={styles.label}>Light</Text>
                 </View>
                 <View style={styles.box}>
                    <Text style={styles.label}>Dark</Text>
                  </View>
                 </SafeAreaView>

                );
    };


const styles = StyleSheet.create({
  container:
  {
    flex: 1,
    backgroundColor: '#D1624A',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header:
  {
    alignSelf: 'center',
    marginVertical: 20,
  },
  headerText:
  {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 24,
      color: '#fff',
      fontWeight: 'bold',
  },
  content:
  {
    paddingBottom: 20,
  },
  box:
  {
    backgroundColor: '#DE7460',
    borderRadius: 3,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label:
  {
      fontFamily: 'Rubik-Medium',
    color: '#fff',
    fontSize: 16,
  },
});