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

/**
 * Shows a cross-platform confirmation dialog.
 * On web, it uses the browser's `confirm()` dialog.
 * On native, it uses `Alert.alert()` with customizable buttons.
 * @param title The title of the dialog.
 * @param message The message to display.
 * @param onConfirm Callback function executed when the user confirms.
 * @param confirmButtonText Text for the confirmation button (default: 'OK').
 * @param cancelButtonText Text for the cancel button (default: 'Cancel').
 */
export function showConfirmationDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmButtonText: string = 'OK',
  cancelButtonText: string = 'Cancel',
) {
  if (Platform.OS === 'web') {
    // window.confirm doesn't have a title, so we prepend it to the message.
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      {
        text: cancelButtonText,
        style: 'cancel',
      },
      {
        text: confirmButtonText,
        onPress: onConfirm,
        style: 'destructive', // This is often the case for confirmations.
      },
    ]);
  }
}
