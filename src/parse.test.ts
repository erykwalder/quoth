import { parse, Embed } from "./parse";

describe("parser", () => {
  it("parses the file name", () => {
    let result: Embed = parse("file: Once in a Blue Moon");
    expect(result.file).toBe("Once in a Blue Moon");

    result = parse("file: Twice in a Blue Moon");
    expect(result.file).toBe("Twice in a Blue Moon");
  });

  it("parses the heading", () => {
    const result: Embed = parse("heading: #Lunar Cycles");
    expect(result.heading).toStrictEqual(["Lunar Cycles"]);
  });

  it("parses multiple headings", () => {
    const result: Embed = parse("heading: #Lunar Cycles#Waning");
    expect(result.heading).toStrictEqual(["Lunar Cycles", "Waning"]);
  });

  it("parses the block id", () => {
    const result: Embed = parse("block: ^foobar1");
    expect(result.block).toBe("^foobar1");
  });

  it("parses a single number-based range", () => {
    const result: Embed = parse("ranges: 5:10 to 7:15");
    expect(result.ranges).toStrictEqual([
      {
        start: { line: 5, col: 10 },
        end: { line: 7, col: 15 },
      },
    ]);
  });

  it("parses a single string-based range", () => {
    const result: Embed = parse(`ranges: "Hello" to "world."`);
    expect(result.ranges).toStrictEqual([
      {
        start: "Hello",
        end: "world.",
      },
    ]);
  });

  it("parses a single mixed range", () => {
    const result: Embed = parse(`ranges: "Hello" to 7:15`);
    expect(result.ranges).toStrictEqual([
      {
        start: "Hello",
        end: { line: 7, col: 15 },
      },
    ]);
  });

  it("parses multiple ranges", () => {
    const result: Embed = parse(`ranges: "Hello" to 7:15, 9:13 to "foobar"`);
    expect(result.ranges).toStrictEqual([
      {
        start: "Hello",
        end: { line: 7, col: 15 },
      },
      {
        start: { line: 9, col: 13 },
        end: "foobar",
      },
    ]);
  });

  it("parses a join string", () => {
    const result: Embed = parse(`join: "; "`);
    expect(result.join).toBe("; ");
  });

  it("parses show options", () => {
    const result: Embed = parse("show: title, author, created");
    expect(result.show).toStrictEqual({
      title: true,
      author: true,
      created: true,
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
file: Once in a Blue Moon
heading: #Lunar Cycles
    `;
    const result: Embed = parse(text);
    expect(result.file).toBe("Once in a Blue Moon");
    expect(result.heading).toStrictEqual(["Lunar Cycles"]);
  });

  it("parses a whole block", () => {
    const text = `file: File Title
heading: #Heading#21
block: ^asdf
ranges: 123:10 to 125:10, 150:6 to "text", "start" to "end"
join: ", "
show: title, created
display: inline`;
    const result: Embed = parse(text);
    expect(result).toStrictEqual({
      file: "File Title",
      heading: ["Heading", "21"],
      block: "^asdf",
      ranges: [
        {
          start: { line: 123, col: 10 },
          end: { line: 125, col: 10 },
        },
        {
          start: { line: 150, col: 6 },
          end: "text",
        },
        {
          start: "start",
          end: "end",
        },
      ],
      join: ", ",
      show: {
        title: true,
        author: false,
        created: true,
      },
      display: "inline",
    });
  });
});
