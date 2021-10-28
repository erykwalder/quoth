export function indexOfLine(text: string, line: number): number {
  let idx = -1;
  for (let newLines = 0; true; newLines++) {
    if (line == newLines) {
      return idx + 1; // advance past newline character
    }
    if ((idx = text.indexOf("\n", idx + 1)) < 0) {
      break;
    }
  }
  return -1;
}

export function uniqueStrRange(text: string, search: string): string[] {
  let startLen = Math.min(search.length, 10);
  while (!isUnique(text, search.slice(0, startLen))) {
    startLen += 1;
  }
  let endLen = Math.min(search.length, 10);
  while (!isUnique(text, search.slice(-endLen))) {
    endLen += 1;
  }
  if (startLen + endLen > search.length) {
    return [search];
  }
  return [search.slice(0, startLen), search.slice(-endLen)];
}

export function isUnique(text: string, search: string): boolean {
  const idx = text.indexOf(search);
  return idx > 0 && text.indexOf(search, idx + 1) === -1;
}
