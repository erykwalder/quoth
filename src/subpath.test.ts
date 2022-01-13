import { BlockCache, HeadingCache } from "obsidian";
import { getContainingBlock, getParentHeadings } from "./subpath";
import { PosRange } from "./range";

const exampleText = `Pre-heading text.
# First Level
TextA
## Second Level One
TextB
## Second Level Two
TextC ^ablockid
### Third Level One
TextD
## Second Level Three
Text E
`;

interface testCache {
  headings: HeadingCache[];
  blocks: Record<string, BlockCache>;
}

function buildCache(text: string): testCache {
  const res: testCache = {
    headings: [],
    blocks: {},
  };
  let offset = 0,
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
    offset += lines[i].length + 1;
  }
  return res;
}

const exampleCache: testCache = buildCache(exampleText);

describe(getContainingBlock, () => {
  it("returns null when blocks is null", () => {
    expect(
      getContainingBlock(
        null,
        new PosRange({ line: 1, ch: 0 }, { line: 1, ch: 8 })
      )
    ).toBeNull();
  });

  it("returns null when not in a block", () => {
    expect(
      getContainingBlock(
        exampleCache.blocks,
        new PosRange({ line: 1, ch: 0 }, { line: 1, ch: 5 })
      )
    ).toBeNull();
  });

  it("returns block id when in a block", () => {
    expect(
      getContainingBlock(
        exampleCache.blocks,
        new PosRange({ line: 6, ch: 0 }, { line: 1, ch: 8 })
      )
    ).toStrictEqual(exampleCache.blocks["ablockid"]);
  });
});

describe(getParentHeadings, () => {
  it("returns empty array when headings is null", () => {
    expect(
      getParentHeadings(
        null,
        new PosRange({ line: 1, ch: 0 }, { line: 1, ch: 8 })
      )
    ).toStrictEqual([]);
  });
  it("returns empty array when range is before any headings", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 0, ch: 0 }, { line: 0, ch: 17 })
      )
    ).toStrictEqual([]);
  });
  it("returns empty array when range starts before any headings", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 0, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([]);
  });
  it("returns one heading when range is under heading", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 2, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0]]);
  });
  it("returns one heading when range includes heading", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 1, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0]]);
  });
  it("returns one heading when range includes children headings", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 1, ch: 0 }, { line: 4, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0]]);
  });
  it("returns two headings when range is under two", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 4, ch: 0 }, { line: 4, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0], exampleCache.headings[1]]);
  });
  it("returns three headings when range is under three", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 8, ch: 0 }, { line: 8, ch: 5 })
      )
    ).toStrictEqual([
      exampleCache.headings[0],
      exampleCache.headings[2],
      exampleCache.headings[3],
    ]);
  });
  it("returns common parent when range contains same-level headings", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 3, ch: 0 }, { line: 6, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0]]);
  });
  it("returns common parent when range crosses child to parent level", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 7, ch: 0 }, { line: 10, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0]]);
  });
  it("returns last heading path when after all headings", () => {
    expect(
      getParentHeadings(
        exampleCache.headings,
        new PosRange({ line: 10, ch: 0 }, { line: 10, ch: 5 })
      )
    ).toStrictEqual([exampleCache.headings[0], exampleCache.headings[4]]);
  });
});
