import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DateItem {
  id: string;
  day: string;
  date: number;
  fullDate: string;
}

const getDayLabel = (offset = 0): DateItem => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const day = date.toLocaleDateString("en-US", { weekday: "short" }); // "Mon"
  const dateNum = date.getDate(); // 12
  return {
    id: offset.toString(),
    day,
    date: dateNum,
    fullDate: date.toDateString(), // optional use
  };
};

export default function Index({ range = 5 }) {
  const navigation = useNavigation();

  const onToggle = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleStyle: {
        color: "#000", // Your desired text color
        fontSize: 24, // Your desired font size
        fontWeight: "bold",
      },
      headerStyle: {
        backgroundColor: "#fff", // Optional: white background
      },
      headerTintColor: "#D1624A",
    });
  }, [navigation]);

  const [selectedId, setSelectedId] = useState<string>("0"); // today = offset 0

  const [dates, setDates] = useState<DateItem[]>([]);

  useEffect(() => {
    // Generate date range: e.g., -3 to +3
    const half = Math.floor(range / 2);
    const dateList = Array.from({ length: range }, (_, i) =>
      getDayLabel(i - half)
    );
    setDates(dateList);
  }, [range]);

  const renderItem = ({ item }: { item: DateItem }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        onPress={() => setSelectedId(item.id)}
        style={styles.itemWrapper}
      >
        <View style={[styles.item, isSelected && styles.selectedItem]}>
          <Text style={[styles.day, isSelected && styles.selectedText]}>
            {item.day}
          </Text>
          <Text style={[styles.date, isSelected && styles.selectedText]}>
            {item.date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      />
      <Text>Home</Text>
      <Button title="Open drawer" onPress={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  itemWrapper: {
    marginRight: 12,
  },
  item: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  selectedItem: {
    backgroundColor: "#D35F46",
  },
  day: {
    fontSize: 12,
    color: "#555",
  },
  date: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  selectedText: {
    color: "#fff",
  },
});