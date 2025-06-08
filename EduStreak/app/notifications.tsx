import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Text, View, StyleSheet, SafeAreaView, FlatList } from "react-native";
import { useLayoutEffect } from "react";

const notifications = [
  {
    id: '1',
    title: "You completed your 'Math Homework' habit...",
    time: 'About 9 minutes ago',
  },
  {
    id: '2',
    title: "Don't forget to study for your upcoming test!",
    time: 'About 2 hours ago',
  },
  {
    id: '3',
    title: "Achievement unlocked: 7-day streak on 'Daily...",
    time: 'About 5 hours ago',
  },
  {
    id: '4',
    title: 'Goal deadline approaching: Submit project in...',
    time: '1h result',
  },
  {
    id: '5',
    title: "You missed your 'Read 20 mins' habit yesterday",
    time: '4 February',
  },
  {
    id: '6',
    title: 'You were invited to join Study Group "Focus..."',
    time: '4 February',
  },
];

export default function Notifications() {
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

              const renderItem = ({ item }) => (
                <View style={styles.notificationItem}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>);

 return (
     <SafeAreaView style={styles.safeArea}>
       <FlatList
         data={notifications}
         renderItem={renderItem}
         keyExtractor={item => item.id}
         contentContainerStyle={styles.listContainer}
       />
     </SafeAreaView>
   );
 }

 const styles = StyleSheet.create({
   safeArea: {
     flex: 1,
     backgroundColor: '#D1624A', // background color from your screenshot
   },
   header: {
     fontSize: 24,
     fontWeight: 'bold',
     paddingHorizontal: 16,
     paddingVertical: 16,
     color: '#fff',
   },
   listContainer: {
     paddingHorizontal: 16,
   },
   notificationItem: {
     borderBottomWidth: 1,
     borderBottomColor: '#f0c0b0',
     paddingVertical: 12,
   },
   title: {
     color: '#fff',
     fontSize: 14,
     marginBottom: 4,
   },
   time: {
     color: '#f8d8c8',
     fontSize: 12,
   },
 });

