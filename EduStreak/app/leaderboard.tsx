import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Dummy data for the leaderboard
const leaderboardData = [
  {
    id: "1",
    rank: 1,
    name: "John Doe",
    score: 5075,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "2",
    rank: 2,
    name: "Alex Smith",
    score: 4985,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "3",
    rank: 3,
    name: "Jane Doe",
    score: 4642,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "4",
    rank: 4,
    name: "Michael Reed",
    score: 3874,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "5",
    rank: 5,
    name: "Emily Carter",
    score: 3567,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "6",
    rank: 6,
    name: "Sarah Lane",
    score: 3478,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "7",
    rank: 7,
    name: "Chris Taylor",
    score: 3387,
    avatar: "https://via.placeholder.com/40",
  },
  {
    id: "8",
    rank: 8,
    name: "Daniel Brooks",
    score: 3257,
    avatar: "https://via.placeholder.com/40",
  },

];

// Functional component for the Leaderboard screen
export default function LeaderboardScreen() {
  const navigation = useNavigation();

  // useLayoutEffect to set navigation options before the screen is rendered.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerTitle: "",
      headerRight: () => (
        <TouchableOpacity style={styles.premiumButton}>
          <Ionicons name="diamond-outline" size={16} color="#fff" />
          <Text style={styles.premiumButtonText}>Premium</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Function to render each item in the leaderboard list.
  const renderLeaderboardItem = ({
    item,
    index,
  }: {
    item: (typeof leaderboardData)[0];
    index: number;
  }) => (
    <View style={[styles.listItem, index < 3 ? styles.topThreeItem : {}]}>
      <View
        style={[
          styles.rankContainer,
          index < 3
            ? styles.topThreeRankContainer
            : styles.regularRankContainer,
        ]}
      >
        <Text
          style={[
            styles.rankText,
            index < 3 ? styles.topThreeRankText : styles.regularRankText,
          ]}
        >
          {item.rank}
        </Text>
      </View>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text style={styles.nameText}>{item.name}</Text>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{item.score}</Text>
      </View>
    </View>
  );

  // Main render method for the component.
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          Group <Text style={styles.titleHighlight}>Leaderboard</Text>
        </Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity>
            <Text style={styles.filterTextActive}>Total Points</Text>
          </TouchableOpacity>
          <Text style={styles.filterSeparator}>|</Text>
          <TouchableOpacity>
            <Text style={styles.filterText}>Longest Streak</Text>
          </TouchableOpacity>
          <Text style={styles.filterSeparator}>|</Text>
          <TouchableOpacity>
            <Text style={styles.filterText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

// StyleSheet for the component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  premiumButton: {
    flexDirection: "row",
    backgroundColor: "#ff4757",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 15,
  },
  premiumButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "bold",
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  titleHighlight: {
    color: "#ff4757",
  },
  filterContainer: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  filterText: {
    fontSize: 14,
    color: "#888",
    marginHorizontal: 5,
    padding: 10,
  },
  filterTextActive: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    marginHorizontal: 5,
  },
  filterSeparator: {
    fontSize: 14,
    color: "#ccc",
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topThreeItem: {
    borderColor: "#ff4757",
    borderWidth: 1.5,
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  topThreeRankContainer: {
    backgroundColor: "#ff4757",
  },
  regularRankContainer: {
    backgroundColor: "#e0e0e0",
  },
  rankText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  topThreeRankText: {
    color: "#fff",
  },
  regularRankText: {
    color: "#555",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  scoreContainer: {
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
