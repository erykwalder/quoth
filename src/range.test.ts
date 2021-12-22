import { PosRange, StringRange } from "./range";

const text = "hello\nworld";

describe(PosRange, () => {
  const range = new PosRange({ line: 0, ch: 1 }, { line: 1, ch: 1 });
  describe("indexes", () => {
    it("locates indexes in string", () => {
      expect(range.indexes(text)).toStrictEqual({ start: 1, end: 7 });
    });
  });
  describe("toString", () => {
    it("outputs in a parseable line:ch to line:ch format", () => {
      expect(range.toString()).toBe("0:1 to 1:1");
    });
  });
});

describe(StringRange, () => {
  const range = new StringRange("el", "or");
  describe("indexes", () => {
    it("locates indexes in string", () => {
      expect(range.indexes(text)).toStrictEqual({ start: 1, end: 9 });
    });
  });
  describe("toString", () => {
    it("outputs in a parseable string to string format", () => {
      expect(range.toString()).toBe(`"el" to "or"`);
    });
  });
});
