import { EditorPosition } from "obsidian";
import { indexOfLine } from "./stringSearch";

export interface Range {
  indexes(doc: string): OffsetRange;
  toString(): string;
}

export class PosRange implements Range {
  constructor(readonly start: EditorPosition, readonly end: EditorPosition) {}
  indexes(doc: string): OffsetRange {
    const start = posIndex(doc, this.start);
    const end = posIndex(doc, this.end);
    return { start, end };
  }
  toString(): string {
    return `${posString(this.start)} to ${posString(this.end)}`;
  }
}

export class StringRange implements Range {
  constructor(readonly start: string, readonly end: string) {}
  indexes(doc: string): OffsetRange {
    const start = stringIndex(doc, this.start);
    const end = stringIndex(doc, this.end, start) + this.end.length;
    return { start, end };
  }
  toString(): string {
    return `${JSON.stringify(this.start)} to ${JSON.stringify(this.end)}`;
  }
}

export class WholeString implements Range {
  constructor(readonly str: string) {}
  indexes(doc: string): OffsetRange {
    const start = stringIndex(doc, this.str);
    const end = start + this.str.length;
    return { start, end };
  }
  toString(): string {
    return JSON.stringify(this.str);
  }
}

export type OffsetRange = {
  start: number;
  end: number;
};

function posString(p: EditorPosition): string {
  return `${p.line}:${p.ch}`;
}

function stringIndex(doc: string, search: string, after?: number): number {
  const index = doc.indexOf(search, after);
  if (index === -1) {
    throw new Error(`Could not find ${JSON.stringify(this.str)} in file`);
  }
  return index;
}

function posIndex(doc: string, pos: EditorPosition): number {
  const lineIndex = indexOfLine(doc, pos.line);
  if (lineIndex === -1 || lineIndex + pos.ch > doc.length) {
    throw new Error(`${posString(pos)} is out of bounds`);
  }
  return lineIndex + pos.ch;
}
