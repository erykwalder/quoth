import { indexOfLine } from "./stringSearch";

const text = "hello\nworld";

describe("indexOfLine", () => {
  it("returns 0 for line 0", () => {
    expect(indexOfLine(text, 0)).toBe(0);
  });
});
