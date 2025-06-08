import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";

import { getAllGroups, getUserGroups, joinGroup } from "../functions/groupService";

const GroupBoard = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState<any[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user) return;

      const [allGroups, joinedGroupIds] = await Promise.all([
        getAllGroups(),
        getUserGroups(user.uid),
      ]);

      setGroups(allGroups);
      setUserGroupIds(joinedGroupIds);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      setJoining(groupId);
      await joinGroup(user.uid, groupId);
      await loadGroups(); // Refresh
    } catch (err) {
      console.error("Failed to join group:", err);
    } finally {
      setJoining(null);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadGroups);
    return unsubscribe;
  }, [navigation]);

  const joinableGroups = groups.filter((g) => !userGroupIds.includes(g.id));
  const userGroups = groups.filter((g) => userGroupIds.includes(g.id));

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
          <View style={{ width: 28 }} />
        </View>

        {/* Join a Group */}
        <Text style={styles.section}>Join a Group</Text>
        <View style={styles.grid}>
          {/* Create Group Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("creategroup")}
          >
            <View style={styles.addCircle}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={[styles.cardText, { color: "#D05B52" }]}>Create Group</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color="#D05B52" />
          ) : (
            joinableGroups.map((group) => (
              <View key={group.id} style={styles.card}>
                <View style={styles.circle} />
                <Text style={styles.cardText}>{group.name}</Text>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoin(group.id)}
                  disabled={joining === group.id}
                >
                  <Text style={styles.joinText}>
                    {joining === group.id ? "Joining..." : "Join"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Your Groups */}
        <Text style={styles.section}>Your Groups</Text>
        <View style={styles.grid}>
          {loading ? (
            <ActivityIndicator size="small" color="#D05B52" />
          ) : (
            userGroups.map((group) => (
              <View key={group.id} style={styles.card}>
                <View style={[styles.circle, { borderColor: "#D05B52" }]} />
                <Text style={[styles.cardText, { color: "#D05B52" }]}>{group.name}</Text>
              </View>
            ))
          )}
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
    backgroundColor: "#F8F8F8",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 8,
  },
  joinButton: {
    backgroundColor: "#D05B52",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  joinText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
