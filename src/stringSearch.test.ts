import { indexOfLine } from "./stringSearch";

describe("indexOfLine", () => {
  const text = "hello\nworld";

  it("returns 0 for line 0", () => {
    expect(indexOfLine(text, 0)).toBe(0);
  });
});
