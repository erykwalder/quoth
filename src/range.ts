import { EditorSelection } from "obsidian";
import { indexOfLine } from "./stringSearch";

export abstract class Range {
  abstract indexes(doc: string): OffsetRange;
  abstract toString(): string;
  text(doc: string): string {
    const { start, end } = this.indexes(doc);
    return doc.slice(start, end);
  }
}

export class PosRange extends Range {
  constructor(readonly start: Pos, readonly end: Pos) {
    super();
  }
  indexes(doc: string): OffsetRange {
    return {
      start: indexOfLine(doc, this.start.line) + this.start.col,
      end: indexOfLine(doc, this.end.line) + this.end.col,
    };
  }
  toString(): string {
    return `${posString(this.start)} to ${posString(this.end)}`;
  }

  static fromEditorSelection(es: EditorSelection): PosRange {
    let start = es.anchor;
    let end = es.head;
    if (
      start.line > end.line ||
      (start.line == end.line && start.ch > end.ch)
    ) {
      [start, end] = [end, start];
    }
    return new PosRange(
      { line: start.line, col: start.ch },
      { line: end.line, col: end.ch }
    );
  }
}

export class StringRange extends Range {
  constructor(readonly start: string, readonly end: string) {
    super();
  }
  indexes(doc: string): OffsetRange {
    const start = doc.indexOf(this.start);
    const end = doc.indexOf(this.end, start) + this.end.length;
    return { start, end };
  }
  toString(): string {
    return `${JSON.stringify(this.start)} to ${JSON.stringify(this.end)}`;
  }
}

export class WholeString extends Range {
  constructor(readonly str: string) {
    super();
  }
  indexes(doc: string): OffsetRange {
    const start = doc.indexOf(this.str);
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

export type Pos = {
  line: number;
  col: number;
};

function posString(p: Pos): string {
  return `${p.line}:${p.col}`;
}