import { indexOfLine, strRange } from "./stringSearch";

const text = "hello\nworld";

describe("indexOfLine", () => {
  it("returns 0 for line 0", () => {
    expect(indexOfLine(text, 0)).toBe(0);
  });
});

describe("strRange", () => {
  it("works on line:col matches", () => {
    expect(
      strRange(text, { start: { line: 0, col: 1 }, end: { line: 1, col: 1 } })
    ).toBe("ello\nw");
  });
  it("works on text matches", () => {
    expect(strRange(text, { start: "ell", end: "wo" })).toBe("ello\nwo");
  });
  it("works on a mix of both", () => {
    expect(strRange(text, { start: { line: 0, col: 1 }, end: "wo" })).toBe(
      "ello\nwo"
    );
  });
});
