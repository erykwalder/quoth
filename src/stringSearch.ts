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
  return text.slice(startChr, endChr);
}

export function uniqueStrRange(text: string, search: string): string[] {
  let startLen = Math.min(search.length, 10);
  while (isRepeated(text, search.slice(0, startLen))) {
    startLen += 1;
  }
  let endLen = Math.min(search.length, 10);
  while (isRepeated(text, search.slice(-endLen))) {
    endLen += 1;
  }
  if (startLen + endLen > search.length) {
    return [search];
  }
  return [search.slice(0, startLen), search.slice(-endLen)];
}

export function isRepeated(text: string, search: string): boolean {
  const idx = text.indexOf(search);
  return idx > 0 && text.indexOf(search, idx + 1) > 0;
}
