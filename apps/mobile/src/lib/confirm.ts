import { Alert } from 'react-native';

/** finestra di conferma nativa; risolve true se l'utente conferma */
export function confirm(
  title: string,
  message: string,
  confirmLabel = 'Conferma',
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annulla', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message?: string): void {
  Alert.alert(title, message);
}
