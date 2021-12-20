import { HeadingCache } from "obsidian";
import { getParentHeadings } from "./headings";
import { PosRange } from "./range";

/** Example Text
`Pre-heading text.
# First Level
TextA
## Second Level One
TextB
## Second Level Two
TextC
### Third Level One
TextD
## Second Level Three
Text E
`;*/

const exampleHeadings: HeadingCache[] = [
  {
    heading: "First Level",
    level: 1,
    position: {
      start: { line: 1, col: 0, offset: 18 },
      end: { line: 1, col: 13, offset: 31 },
    },
  },
  {
    heading: "Second Level One",
    level: 2,
    position: {
      start: { line: 3, col: 0, offset: 38 },
      end: { line: 3, col: 19, offset: 57 },
    },
  },
  {
    heading: "Second Level Two",
    level: 2,
    position: {
      start: { line: 5, col: 0, offset: 64 },
      end: { line: 5, col: 19, offset: 83 },
    },
  },
  {
    heading: "Third Level One",
    level: 3,
    position: {
      start: { line: 7, col: 0, offset: 90 },
      end: { line: 7, col: 19, offset: 109 },
    },
  },
  {
    heading: "Second Level Three",
    level: 2,
    position: {
      start: { line: 9, col: 0, offset: 116 },
      end: { line: 9, col: 21, offset: 137 },
    },
  },
];

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
        exampleHeadings,
        new PosRange({ line: 0, ch: 0 }, { line: 0, ch: 17 })
      )
    ).toStrictEqual([]);
  });
  it("returns empty array when range starts before any headings", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 0, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([]);
  });
  it("returns one heading when range is under heading", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 2, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0]]);
  });
  it("returns one heading when range includes heading", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 1, ch: 0 }, { line: 2, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0]]);
  });
  it("returns one heading when range includes children headings", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 1, ch: 0 }, { line: 4, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0]]);
  });
  it("returns two headings when range is under two", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 4, ch: 0 }, { line: 4, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0], exampleHeadings[1]]);
  });
  it("returns three headings when range is under three", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 8, ch: 0 }, { line: 8, ch: 5 })
      )
    ).toStrictEqual([
      exampleHeadings[0],
      exampleHeadings[2],
      exampleHeadings[3],
    ]);
  });
  it("returns common parent when range contains same-level headings", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 3, ch: 0 }, { line: 6, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0]]);
  });
  it("returns common parent when range crosses child to parent level", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 7, ch: 0 }, { line: 10, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0]]);
  });
  it("returns last heading path when after all headings", () => {
    expect(
      getParentHeadings(
        exampleHeadings,
        new PosRange({ line: 10, ch: 0 }, { line: 10, ch: 5 })
      )
    ).toStrictEqual([exampleHeadings[0], exampleHeadings[4]]);
  });
});
