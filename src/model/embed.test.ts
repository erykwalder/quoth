import { parse, Embed } from "./embed";
import {
  AfterPos,
  AfterString,
  PosRange,
  StringRange,
  WholeString,
} from "./range";

describe("parser", () => {
  it("parses the path with just a filename", () => {
    const result: Embed = parse("path: [[Once in a Blue Moon]]");
    expect(result.file).toBe("Once in a Blue Moon");
  });

  it("parses the path with a filename and heading", () => {
    let result: Embed = parse("path: [[Once in a Blue Moon#Lunar Cycles]]");
    expect(result.file).toBe("Once in a Blue Moon");
    expect(result.subpath).toBe("#Lunar Cycles");

    result = parse("path: [[Once in a Blue Moon#Lunar Cycles#21]]");
    expect(result.file).toBe("Once in a Blue Moon");
    expect(result.subpath).toBe("#Lunar Cycles#21");
  });

  it("parses the path with a filename and block id", () => {
    const result: Embed = parse("path: [[Once in a Blue Moon#^ablockid]]");
    expect(result.file).toBe("Once in a Blue Moon");
    expect(result.subpath).toBe("#^ablockid");
  });

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

  it("parses an after string range", () => {
    const result: Embed = parse(`ranges: after "Hello"`);
    expect(result.ranges).toStrictEqual([new AfterString("Hello")]);
  });

  it("parses an after pos range", () => {
    const result: Embed = parse(`ranges: after 0:5`);
    expect(result.ranges).toStrictEqual([new AfterPos({ line: 0, ch: 5 })]);
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
ranges: 123:10 to 125:10, "doc" to "text", "start" to "end", after "text"
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
        new AfterString("text"),
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
