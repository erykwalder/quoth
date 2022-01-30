import { indexOfLine, indexPos, isUnique } from "./stringSearch";

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

describe(indexPos, () => {
  it("returns 0:0 for index 0", () => {
    expect(indexPos("", 0)).toStrictEqual({ line: 0, ch: 0 });
    expect(indexPos("hello", 0)).toStrictEqual({ line: 0, ch: 0 });
  });
  it("returns correct character for one line", () => {
    expect(indexPos("hello", 1)).toStrictEqual({ line: 0, ch: 1 });
    expect(indexPos("hello", 2)).toStrictEqual({ line: 0, ch: 2 });
    expect(indexPos("hello", 3)).toStrictEqual({ line: 0, ch: 3 });
    expect(indexPos("hello", 4)).toStrictEqual({ line: 0, ch: 4 });
    expect(indexPos("hello", 5)).toStrictEqual({ line: 0, ch: 5 });
  });
  it("returns correct line for multiple lines", () => {
    expect(indexPos("\nhello", 1)).toStrictEqual({ line: 1, ch: 0 });
    expect(indexPos("\n\nhello", 2)).toStrictEqual({ line: 2, ch: 0 });
    expect(indexPos("\n\n\nhello", 3)).toStrictEqual({ line: 3, ch: 0 });
  });
  it("returns correct line and ch for multiple lines", () => {
    expect(indexPos("test\nhello\nworld", 4)).toStrictEqual({ line: 0, ch: 4 });
    expect(indexPos("test\nhello\nworld", 5)).toStrictEqual({ line: 1, ch: 0 });
    expect(indexPos("test\nhello\nworld", 10)).toStrictEqual({
      line: 1,
      ch: 5,
    });
    expect(indexPos("test\nhello\nworld", 11)).toStrictEqual({
      line: 2,
      ch: 0,
    });
    expect(indexPos("test\nhello\nworld", 16)).toStrictEqual({
      line: 2,
      ch: 5,
    });
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
