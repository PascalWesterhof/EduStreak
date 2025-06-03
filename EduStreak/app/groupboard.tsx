import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, DrawerActions, Link } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const GroupBoard = () => {
  const navigation = useNavigation();

  const groups = [
    {
      id: "g1",
      name: "Read&Repeat",
      joined: false,
    },
    {
      id: "g2",
      name: "StudySync",
      joined: false,
    },
    {
      id: "g3",
      name: "PageTurners",
      joined: false,
    },
    {
      id: "g4",
      name: "Study Group",
      joined: true,
    },
    {
      id: "g5",
      name: "Study Group",
      joined: true,
    },
  ];

  const joinableGroups = groups.filter((g) => !g.joined);
  const userGroups = groups.filter((g) => g.joined);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <Ionicons name="menu" size={28} color="#D05B52" />
          </TouchableOpacity>
          <Text style={styles.title}>
            <Text style={{ fontWeight: "bold" }}>Group</Text>{" "}
            <Text style={{ color: "#D05B52", fontWeight: "bold" }}>Board</Text>
          </Text>
          <View style={{ width: 28 }} /> {/* Placeholder for spacing */}
        </View>

        {/* Join Section */}
        <Text style={styles.section}>Join a Group</Text>
        <View style={styles.grid}>
          {/* Create Group */}
          <Link href="./creategroup" asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.addCircle}>
                  <Text style={styles.addPlus}>+</Text>
                </View>
                <Text style={[styles.cardText, { color: "#D05B52" }]}>Create Group</Text>
              </TouchableOpacity>
          </Link>

          {joinableGroups.map((group) => (
            <View key={group.id} style={styles.card}>
              <View style={styles.circle} />
              <Text style={styles.cardText}>{group.name}</Text>
            </View>
          ))}
        </View>

        {/* User Groups */}
        <Text style={styles.section}>Your Groups</Text>
        <View style={styles.grid}>
          {userGroups.map((group) => (
            <View key={group.id} style={styles.card}>
              <View style={[styles.circle, { borderColor: "#D05B52" }]} />
              <Text style={[styles.cardText, { color: "#D05B52" }]}>{group.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    paddingBottom: 20,
  },
  header: {
    marginTop: 10,
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  section: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 24,
  },
  card: {
    width: 150,
    height: 150,
    backgroundColor: "#F8F8F8",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D05B52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addPlus: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 8,
  },
});
