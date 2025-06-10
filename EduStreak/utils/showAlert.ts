import { Alert, Platform } from "react-native";

export function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    // Use the browser alert on web
    window.alert(`${title}\n\n${message}`);
  } else {
    // Use React Native Alert on iOS/Android
    Alert.alert(title, message);
  }
}
