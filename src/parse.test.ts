import { parse, Embed } from "./parse";

describe("parser", () => {
  it("parses the file name", () => {
    let result: Embed = parse("file: [[Once in a Blue Moon]]");
    expect(result.file).toBe("[[Once in a Blue Moon]]");

    result = parse("file: [[Twice in a Blue Moon]]");
    expect(result.file).toBe("[[Twice in a Blue Moon]]");
  });

  it("parses the heading", () => {
    const result: Embed = parse("heading: #Lunar Cycles");
    expect(result.heading).toBe("#Lunar Cycles");
  });

  it("parses multiple lines", () => {
    const text = `
file: [[Once in a Blue Moon]]
heading: #Lunar Cycles
    `;
    const result: Embed = parse(text);
    expect(result.file).toBe("[[Once in a Blue Moon]]");
    expect(result.heading).toBe("#Lunar Cycles");
  });
});
