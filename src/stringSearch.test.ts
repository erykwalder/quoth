import { indexOfLine, isUnique } from "./stringSearch";

const text = "hello\nworld";

describe(indexOfLine, () => {
  it("returns 0 for line 0", () => {
    expect(indexOfLine(text, 0)).toBe(0);
  });
  it("returns offset for line 1", () => {
    expect(indexOfLine(text, 1)).toBe(6);
  });
  it("returns -1 for too many lines", () => {
    expect(indexOfLine(text, 2)).toBe(-1);
  });
});

describe(isUnique, () => {
  it("returns true when match is at the start and unique", () => {
    expect(isUnique(text, "he")).toBe(true);
  });
  it("returns false when search repeats", () => {
    expect(isUnique(text, "l")).toBe(false);
  });
});
