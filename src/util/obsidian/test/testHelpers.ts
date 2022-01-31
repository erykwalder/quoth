import { BlockCache, HeadingCache, ListItemCache } from "obsidian";

export interface testCache {
  headings: HeadingCache[];
  blocks: Record<string, BlockCache>;
  listItems: ListItemCache[];
}

export function buildCache(text: string): testCache {
  const res: testCache = {
    headings: [],
    listItems: [],
    blocks: {},
  };
  let offset = 0,
    listStack: ListItemCache[] = [],
    match;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if ((match = lines[i].match(/^(#+) (.+?)$/))) {
      res.headings.push({
        heading: match[2],
        level: match[1].length,
        position: {
          start: { line: i, col: 0, offset: offset },
          end: {
            line: i,
            col: lines[i].length,
            offset: offset + lines[i].length,
          },
        },
      });
    }
    if ((match = lines[i].match(/ \^([A-Za-z0-9]+)$/))) {
      res.blocks[match[1]] = {
        id: match[1],
        position: {
          start: { line: i, col: 0, offset: offset },
          end: {
            line: i,
            col: lines[i].length,
            offset: offset + lines[i].length,
          },
        },
      };
    }
    // List items can be far more complex, but this suffices for testing
    if ((match = lines[i].match(/^(\s*)(\d+[.)]|[*+-])\s+/))) {
      const indent = match[1].length;
      const li = {
        parent: Math.min(-i, -1),
        position: {
          start: { line: i, col: indent, offset: offset + indent },
          end: {
            line: i,
            col: lines[i].length,
            offset: offset + lines[i].length,
          },
        },
      };
      while (
        listStack.length > 0 &&
        listStack.last().position.start.col > indent
      ) {
        listStack.pop();
      }
      if (listStack.length > 0) {
        if (indent === listStack.last().position.start.col) {
          li.parent = listStack.last().parent;
          listStack.pop();
        } else {
          li.parent = listStack.last().position.start.line;
        }
      }
      listStack.push(li);
      res.listItems.push(li);
    } else {
      listStack = [];
    }
    offset += lines[i].length + 1;
  }
  return res;
}
