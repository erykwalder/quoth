import { EmbedRange, isPos } from "./parse";

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

export function strRange(text: string, range: EmbedRange): string {
  let startChr: number, endChr: number;
  if (isPos(range.start)) {
    startChr = indexOfLine(text, range.start.line) + range.start.col;
  } else {
    startChr = text.indexOf(range.start);
  }
  if (isPos(range.end)) {
    endChr = indexOfLine(text, range.end.line) + range.end.col;
  } else {
    endChr = text.indexOf(range.end, startChr) + range.end.length;
  }
  return text.substring(startChr, endChr);
}
