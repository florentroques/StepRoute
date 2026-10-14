/** react-native-web's Alert.alert is a no-op, so fall back to the browser dialog. */
export function showAlert(title: string, message: string) {
  window.alert(`${title}\n\n${message}`);
}
