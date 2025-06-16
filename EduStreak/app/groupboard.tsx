import React, { useEffect, useState, useMemo } from "react"; // << useMemo toegevoegd
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, DrawerActions } from "@react-navigation/native";
// import { Ionicons } from "@expo/vector-icons"; // Niet gebruikt, kan weg als je geen Ionicons gebruikt hier
import { getAuth } from "firebase/auth";

import { getAllGroups, getUserGroups, joinGroup } from "../functions/groupService";
import { showAlert } from "../utils/showAlert";
import { useTheme } from '../functions/themeFunctions/themeContext'; // << NIEUW
import { ColorScheme } from '../functions/themeFunctions/themeContext'; // << NIEUW

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Was #fff
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
  titleBaseText: { // Nieuwe basisstijl voor de titel
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text, // Thematische kleur voor "Group"
  },
  titleAccentText: { // Nieuwe stijl voor het geaccentueerde deel van de titel
    fontSize: 28, // Moet overeenkomen met titleBaseText
    fontWeight: "bold", // Moet overeenkomen
    color: colors.primary, // Was #D05B52, nu thematisch primary
  },
  section: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
    color: colors.text, // Thematische sectietitel kleur
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 24,
  },
  card: {
    width: 150,
    backgroundColor: colors.cardBackground, // Was #F8F8F8
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
    backgroundColor: colors.primary, // Was #D05B52
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addPlus: {
    color: colors.primaryText, // Was #fff
    fontSize: 24,
    fontWeight: "bold",
  },
  cardText: { // Standaard kaarttekst
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDefault, // Was #000, nu thematisch
    textAlign: "center",
    marginBottom: 8,
  },
  cardTextAccent: { // Geaccentueerde kaarttekst
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary, // Was #D05B52
    textAlign: "center",
    marginBottom: 8,
  },
  circle: { // Fallback cirkel
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary, // Was #DC817A (gerelateerd aan primary, nu secondary)
                                     // Of een andere themakleur zoals colors.placeholderText
    borderWidth: 1,
    borderColor: colors.borderColor, // Was #000, nu thematisch
    marginBottom: 8,
  },
  circleAccentBorder: { // Voor "Your Groups" cirkel met accent border
    borderColor: colors.primary, // Was #D05B52
  },
  joinButton: {
    backgroundColor: colors.primary, // Was #D05B52
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  joinText: {
    color: colors.primaryText, // Was #fff
    fontSize: 12,
    fontWeight: "bold",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    resizeMode: "cover",
  },
  activityIndicator: { // Stijl voor ActivityIndicator
    // Je kunt hier meer stijlen toevoegen als je wilt dat het groter is of anders gepositioneerd
  }
});

// Image mapping
const IMAGE_MAP: Record<string, any> = {
  group1: require("../assets/groupImages/image1.png"),
  group2: require("../assets/groupImages/image2.png"),
  group3: require("../assets/groupImages/image3.png"),
};

const GroupBoard = () => {
 const { colors: themeColors } = useTheme(); // << NIEUW
   const styles = useMemo(() => getStyles(themeColors), [themeColors]); // << NIEUW

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

      // Sort alphabetically by group name
      const sortedGroups = allGroups.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      setGroups(sortedGroups);
      setUserGroupIds(joinedGroupIds);
    } catch (err) {
      console.error("Failed to load groups:", err);
      showAlert("Error", "Failed to load groups. Please try again.");
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
      showAlert("Error", "Failed to join the group. Please try again.");
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
             <Text> {/* Container Text om inline styling van kind Text componenten toe te staan */}
               <Text style={styles.titleBaseText}>Group</Text>{" "}
               <Text style={styles.titleAccentText}>Board</Text>
             </Text>
             {/* Hamburger menu icoon (als nodig, nu leeg View voor spacing) */}
             {/* <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                <Ionicons name="menu" size={28} color={themeColors.icon} />
             </TouchableOpacity> */}
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
               <Text style={styles.cardTextAccent}>Create Group</Text>
             </TouchableOpacity>

             {loading ? (
               <ActivityIndicator style={styles.activityIndicator} size="small" color={themeColors.primary} />
             ) : (
               joinableGroups.map((group) => (
                 <View key={group.id} style={styles.card}>
                   {IMAGE_MAP[group.imageUrl] ? (
                     <Image source={IMAGE_MAP[group.imageUrl]} style={styles.image} />
                   ) : (
                     <View style={styles.circle} /> // Standaard cirkel
                   )}
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
               <ActivityIndicator style={styles.activityIndicator} size="small" color={themeColors.primary} />
             ) : (
               userGroups.map((group) => (
                 <TouchableOpacity
                   key={group.id}
                   style={styles.card}
                   onPress={() => navigation.navigate("groupdetails", { groupId: group.id })}
                 >
                   {IMAGE_MAP[group.imageUrl] ? (
                     <Image source={IMAGE_MAP[group.imageUrl]} style={styles.image} />
                   ) : (
                     // Cirkel met geaccentueerde border
                     <View style={[styles.circle, styles.circleAccentBorder]} />
                   )}
                   <Text style={styles.cardTextAccent}>{group.name}</Text>
                 </TouchableOpacity>
               ))
             )}
           </View>
         </ScrollView>
       </SafeAreaView>
     );
   };

   export default GroupBoard;