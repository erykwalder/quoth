import {
  AfterPos,
  AfterString,
  PosRange,
  StringRange,
  WholeString,
} from "./range";

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

describe(WholeString, () => {
  const range = new WholeString("hello");
  describe("indexes", () => {
    it("locates indexes in string", () => {
      expect(range.indexes(text)).toStrictEqual({ start: 0, end: 5 });
    });
  });
  describe("toString", () => {
    it("outputs in a parseable string format", () => {
      expect(range.toString()).toBe(`"hello"`);
    });
  });
});

describe(AfterPos, () => {
  const range = new AfterPos({ line: 1, ch: 0 });
  describe("indexes", () => {
    it("locates indexes in string", () => {
      expect(range.indexes(text)).toStrictEqual({ start: 6, end: 11 });
    });
  });
  describe("toString", () => {
    it("outputs in a parseable string format", () => {
      expect(range.toString()).toBe(`after 1:0`);
    });
  });
});

describe(AfterString, () => {
  const range = new AfterString("hello");
  describe("indexes", () => {
    it("locates indexes in string", () => {
      expect(range.indexes(text)).toStrictEqual({ start: 5, end: 11 });
    });
  });
  describe("toString", () => {
    it("outputs in a parseable string format", () => {
      expect(range.toString()).toBe(`after "hello"`);
    });
  });
});
