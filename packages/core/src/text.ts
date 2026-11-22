/** "a" · "a e b" · "a, b e c" (stringa vuota per lista vuota) */
export function joinItalian(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' e ' + items[items.length - 1];
}

/** ogni riga non vuota inizia con un trattino, come il resto del referto */
export function dashifyLines(text: string): string {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith('-') ? l : '-' + l))
    .join('\n');
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
