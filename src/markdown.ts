import { Range } from "./range";

const blockquoteMarkdown = ["    ", "\t", ">"];
const listMarkdown = /^(\d+\.|-|\+|\*)( |\t)/;
const textMarkdown = ["**", "__", "~~", "==", "*", "_", "`"];

export function extractRangeWithContext(text: string, range: Range): string {
  const { start, end } = range.indexes(text);
  return (
    markdownPrefix(text, start) +
    text.slice(start, end) +
    markdownSuffix(text, end)
  );
}

function markdownPrefix(text: string, start: number): string {
  const startLine = text.slice(text.lastIndexOf("\n", start) + 1, start);
  const startMd = lineMarkdown(startLine);
  return startMd.start.join("") + startMd.unclosed.join("");
}

function markdownSuffix(text: string, end: number): string {
  const endLine = text.slice(text.lastIndexOf("\n", end) + 1, end);
  const endMd = lineMarkdown(endLine);
  return endMd.unclosed.reverse().join("");
}

export function normalizeMarkdown(text: string): string {
  let parts: string[] = text.split("\n");

  // Remove blockquotes up to the minimum per line
  while (parts[0].length > 0) {
    const md = blockquoteMarkdown.find((md) => {
      return parts.filter((p) => p.startsWith(md)).length === parts.length;
    });
    if (md) {
      parts = parts.map((p) => p.slice(md.length));
    } else {
      break;
    }
  }

  // Remove bullet point if there's only one line
  let match;
  if (parts.length === 1 && (match = parts[0].match(listMarkdown))) {
    parts[0] = parts[0].slice(match[0].length);
  }

  return parts.join("\n");
}

function lineMarkdown(str: string): { start: string[]; unclosed: string[] } {
  const start: string[] = [];
  const unclosed: string[] = [];
  while (str.length > 0) {
    const md = blockquoteMarkdown.find((md) => str.startsWith(md));
    if (md) {
      start.push(md);
      str = str.slice(md.length);
      continue;
    }
    let match;
    if ((match = str.match(listMarkdown))) {
      start.push(match[0]);
      str = str.slice(match[0].length);
      continue;
    }
    break;
  }
  while (str.length > 0) {
    const md = textMarkdown.find((md) => str.startsWith(md));
    if (md) {
      if (unclosed.last() === md) {
        unclosed.pop();
      } else {
        unclosed.push(md);
      }
      str = str.slice(md.length);
    } else {
      str = str.slice(1);
    }
  }
  return { start, unclosed };
}
