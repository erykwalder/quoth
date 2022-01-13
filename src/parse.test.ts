import { parse, Embed } from "./parse";
import { PosRange, StringRange, WholeString } from "./range";

describe("parser", () => {
  it("parses the file name", () => {
    let result: Embed = parse("file: [[Once in a Blue Moon]]");
    expect(result.file).toBe("Once in a Blue Moon");

    result = parse("file: [[Twice in a Blue Moon]]");
    expect(result.file).toBe("Twice in a Blue Moon");
  });

  it("parses the heading", () => {
    const result: Embed = parse("heading: #Lunar Cycles");
    expect(result.subpath).toBe("#Lunar Cycles");
  });

  it("parses multiple headings", () => {
    const result: Embed = parse("heading: #Lunar Cycles#Waning");
    expect(result.subpath).toBe("#Lunar Cycles#Waning");
  });

  it("parses a block id", () => {
    const result: Embed = parse("block: ^blockid");
    expect(result.subpath).toBe("#^blockid");
  });

  it("parses a single number-based range", () => {
    const result: Embed = parse("ranges: 5:10 to 7:15");
    expect(result.ranges).toStrictEqual([
      new PosRange({ line: 5, ch: 10 }, { line: 7, ch: 15 }),
    ]);
  });

  it("parses a single string-based range", () => {
    const result: Embed = parse(`ranges: "Hello" to "world."`);
    expect(result.ranges).toStrictEqual([new StringRange("Hello", "world.")]);
  });

  it("parses a single whole-string range", () => {
    const result: Embed = parse(`ranges: "Hello world."`);
    expect(result.ranges).toStrictEqual([new WholeString("Hello world.")]);
  });

  it("parses multiple ranges", () => {
    const result: Embed = parse(`ranges: "Hello" to "foobar", "Biz" to "baz"`);
    expect(result.ranges).toStrictEqual([
      new StringRange("Hello", "foobar"),
      new StringRange("Biz", "baz"),
    ]);
  });

  it("parses a join string", () => {
    const result: Embed = parse(`join: "; "`);
    expect(result.join).toBe("; ");
  });

  it("parses show options", () => {
    const result: Embed = parse("show: title, author");
    expect(result.show).toStrictEqual({
      title: true,
      author: true,
    });
  });

  it("defaults join to ...", () => {
    const result: Embed = parse("");
    expect(result.join).toBe(" ... ");
  });

  it("parses the display setting", () => {
    const result: Embed = parse("display: inline");
    expect(result.display).toBe("inline");
  });

  it("defaults the display setting to embedded", () => {
    const result: Embed = parse("");
    expect(result.display).toBe("embedded");
  });

  it("parses multiple lines", () => {
    const text = `
file: [[Once in a Blue Moon]]
heading: #Lunar Cycles
    `;
    const result: Embed = parse(text);
    expect(result.file).toBe("Once in a Blue Moon");
    expect(result.subpath).toBe("#Lunar Cycles");
  });

  it("parses a whole block", () => {
    const text = `file: [[File Title]]
heading: #Heading#21
block: ^someid
ranges: 123:10 to 125:10, "doc" to "text", "start" to "end"
join: ", "
show: title
display: inline`;
    const result: Embed = parse(text);
    expect(result).toStrictEqual({
      file: "File Title",
      subpath: "#Heading#21#^someid",
      ranges: [
        new PosRange({ line: 123, ch: 10 }, { line: 125, ch: 10 }),
        new StringRange("doc", "text"),
        new StringRange("start", "end"),
      ],
      join: ", ",
      show: {
        title: true,
        author: false,
      },
      display: "inline",
    });
  });
});
