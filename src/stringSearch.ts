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
