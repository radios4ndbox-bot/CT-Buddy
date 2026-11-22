/** contatore delle modifiche alla libreria: le liste aperte si ricaricano quando cambia */
import { useSyncExternalStore } from 'react';

let revision = 0;
const listeners = new Set<() => void>();

export function bumpLibrary(): void {
  revision++;
  listeners.forEach((l) => l());
}

export function useLibraryRevision(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => revision,
  );
}
