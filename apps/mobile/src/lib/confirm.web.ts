// Alert.alert con pulsanti non è supportato su web: si usano i dialoghi del browser
export function confirm(title: string, message: string): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}

export function notify(title: string, message?: string): void {
  window.alert(message ? `${title}\n\n${message}` : title);
}
