import React, { useEffect, useState, useMemo } from "react"; // << useMemo toegevoegd
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  // Image, // Niet gebruikt in dit bestand, kan weg als het nergens anders nodig is
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { leaveGroup } from "../functions/groupService";
import { showAlert } from "../utils/showAlert";
import { useTheme } from '../functions/themeFunctions/themeContext'; // << NIEUW
import { ColorScheme } from '../functions/themeFunctions/themeContext'; // << NIEUW

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background, // Was #fff
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.text, // Thematische tekstkleur
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary, // Was #555
    marginBottom: 24,
  },
  memberCount: {
    fontSize: 14,
    color: colors.textMuted, // Was #999
    marginBottom: 16,
  },
  membersContainer: {
    marginBottom: 32,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  initialsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary, // Was #D05B52
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: colors.primaryText, // Was #fff
    fontWeight: "bold",
    fontSize: 18,
  },
  memberName: {
    fontSize: 16,
    color: colors.textDefault, // Was #333
    marginLeft: 12,
  },
  button: {
    backgroundColor: colors.primary, // Was #D05B52
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  buttonDisabled: { // Stijl voor disabled button
    backgroundColor: colors.textMuted, // Of een andere gedempte kleur
  },
  buttonText: {
    color: colors.primaryText, // Was #fff
    fontWeight: "bold",
    fontSize: 16,
  },
  center: { // Voor loading state
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background, // Achtergrond ook hier thematisch
  },
  returnButton: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: colors.primary, // Was #D05B52
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: "center",
    backgroundColor: colors.cardBackground, // Was #fff, nu thematisch (of colors.background)
  },
  returnButtonText: {
    color: colors.primary, // Was #D05B52
    fontWeight: "bold",
    fontSize: 16,
  },
  activityIndicator: { // Stijl voor ActivityIndicator
    // eventuele extra styling hier
  }
});

const GroupDetails = () => {
const { colors: themeColors } = useTheme(); // << NIEUW
  const styles = useMemo(() => getStyles(themeColors), [themeColors]); // << NIEUW

  const route = useRoute();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const user = getAuth().currentUser;

  const getInitials = (name?: string, id?: string) => {
    if (!name) return id?.slice(0, 2).toUpperCase() || "??";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
    );
  };

  useEffect(() => {
    const fetchGroupAndMembers = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          showAlert("Error", "Group not found");
          navigation.goBack();
          return;
        }

        const groupData = { id: groupSnap.id, ...groupSnap.data() };
        setGroup(groupData);

        if (groupData.members && groupData.members.length > 0) {
          const memberPromises = groupData.members.map(async (memberId: string) => {
            const userRef = doc(db, "users", memberId);
            const userSnap = await getDoc(userRef);
            return {
              id: memberId,
              displayName: userSnap.exists() ? userSnap.data()?.displayName || "Unknown" : "Unknown",
            };
          });

          const memberData = await Promise.all(memberPromises);
          setMembers(memberData);
        } else {
          setMembers([]);
        }
      } catch (error) {
        showAlert("Error", "Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupAndMembers();
  }, [groupId, navigation]);

  const handleLeaveGroup = async () => {
    if (!user) {
      showAlert("Error", "User not logged in");
      return;
    }

    setLeaving(true);
    try {
      await leaveGroup(user.uid, groupId);
      showAlert("Success", "You have left the group");
      navigation.goBack();
    } catch (error) {
      showAlert("Error", "Failed to leave group");
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!group) {
    return null;
  }

  const memberCount = group.members?.length || 0;

  return (
   <View style={styles.container}>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.description}>
          {group.description || "No description provided."}
        </Text>
        <Text style={styles.memberCount}>Members: {memberCount}</Text>

        <View style={styles.membersContainer}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>
                  {getInitials(member.displayName, member.id)}
                </Text>
              </View>
              <Text style={styles.memberName}>{member.displayName || "Unknown"}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, leaving && styles.buttonDisabled]} // Gebruik styles.buttonDisabled
          onPress={handleLeaveGroup}
          disabled={leaving}
        >
          <Text style={styles.buttonText}>{leaving ? "Leaving..." : "Leave Group"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.navigate("groupboard")}
        >
          <Text style={styles.returnButtonText}>Return to Group Board</Text>
        </TouchableOpacity>
      </View>
    );
  };

  export default GroupDetails;