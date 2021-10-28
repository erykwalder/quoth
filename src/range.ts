import { EditorSelection } from "obsidian";
import { indexOfLine } from "./stringSearch";

export interface Range {
  indexes(doc: string): OffsetRange;
  text(doc: string): string;
  toString(): string;
}

export class PosRange implements Range {
  constructor(readonly start: Pos, readonly end: Pos) {}
  indexes(doc: string): OffsetRange {
    return {
      start: indexOfLine(doc, this.start.line) + this.start.col,
      end: indexOfLine(doc, this.end.line) + this.end.col,
    };
  }
  text(doc: string): string {
    const { start, end } = this.indexes(doc);
    return doc.slice(start, end);
  }
  toString(): string {
    return `${this.start.line}:${this.start.col} to ${this.end.line}:${this.end.col}`;
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

export class StringRange implements Range {
  constructor(readonly start: string, readonly end: string) {}
  indexes(doc: string): OffsetRange {
    const start = doc.indexOf(this.start);
    const end = doc.indexOf(this.end, start) + this.end.length;
    return { start, end };
  }
  text(doc: string): string {
    const { start, end } = this.indexes(doc);
    return doc.slice(start, end);
  }
  toString(): string {
    return `${JSON.stringify(this.start)} to ${JSON.stringify(this.end)}`;
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
