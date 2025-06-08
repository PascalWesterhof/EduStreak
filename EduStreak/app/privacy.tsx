import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable } from "react-native";
import React, { useState } from 'react';
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";

export default function Privacy()
{
      const navigation = useNavigation();

        const onToggle = () =>
        {
            navigation.dispatch(DrawerActions.openDrawer());
        };
          useLayoutEffect(() => {
                navigation.setOptions({
                    headerTitleStyle: {
                      color: '#fff',       // Your desired text color
                      fontSize: 24,        // Your desired font size
                      fontWeight: 'bold',

                    },
                    headerStyle: {
                      backgroundColor: '#D1624A', // Optional: white background
                    },
                 headerTintColor: '#fff'
                  });
                }, [navigation]);

            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.box}>
                   <Text style={styles.label}>At EduStreak, protecting your privacy is just as important as supporting your learning journey. We are committed to being transparent about how we handle your data.{'\n'}{'\n'}

                                              We collect only the information necessary to personalize your experience, such as your progress, streaks, and leaderboard stats. This data helps us keep you motivated and on track, and it always stays private and secure.{'\n'}{'\n'}

                                              We never sell your personal data or use it for advertising. You are in full control, with the ability to view, manage, or delete your information whenever you choose.{'\n'}{'\n'}

                                              Learning should be safe, focused, and free from distractions. With EduStreak, you can trust that your data stays where it belongs—with you.</Text>
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
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 20,
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
    color: '#fff',
    fontSize: 16,
  },
});