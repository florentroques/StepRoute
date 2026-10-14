/** react-native-web's Alert.alert is a no-op, so fall back to the browser dialog. */
export async function confirmAction(title: string, message: string): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}
