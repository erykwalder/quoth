import { extractRangeWithContext } from "./markdown";
import { WholeString } from "./range";

Array.prototype.last = function (): unknown {
  if (this.length > 0) {
    return this[this.length - 1];
  }
  return undefined;
};

// text, matched range, result
type testCase = [string, string, string];

function testExtract(cases: testCase[]) {
  cases.forEach((c) => {
    expect(extractRangeWithContext(c[0], new WholeString(c[1]))).toBe(c[2]);
  });
}

describe(extractRangeWithContext, () => {
  it("prepends list bullets", () => {
    testExtract([
      ["- Testing", "Testing", "- Testing"],
      ["* Testing", "Testing", "* Testing"],
      ["+ Testing", "Testing", "+ Testing"],
      ["11. Testing", "Testing", "11. Testing"],
    ]);
  });

  it("prepends blockquotes", () => {
    testExtract([
      [">Testing", "Testing", ">Testing"],
      ["> Testing", "Testing", "> Testing"],
      [">\tTesting", "Testing", ">\tTesting"],
      ["\tTesting", "Testing", "\tTesting"],
      ["    Testing", "Testing", "    Testing"],
    ]);
  });

  it("opens closed tags", () => {
    testExtract([
      ["**Testing Open**", "Open**", "**Open**"],
      ["__Testing Open__", "Open__", "__Open__"],
      ["*Testing Open*", "Open*", "*Open*"],
      ["_Testing Open_", "Open_", "_Open_"],
      ["==Testing Open==", "Open==", "==Open=="],
      ["~~Testing Open~~", "Open~~", "~~Open~~"],
    ]);
  });

  it("closes open tags", () => {
    testExtract([
      ["**Testing Close**", "**Testing", "**Testing**"],
      ["__Testing Close__", "__Testing", "__Testing__"],
      ["*Testing Close*", "*Testing", "*Testing*"],
      ["_Testing Close_", "_Testing", "_Testing_"],
      ["==Testing Close==", "==Testing", "==Testing=="],
      ["~~Testing Close~~", "~~Testing", "~~Testing~~"],
      ["`Testing Close`", "`Testing", "`Testing`"],
    ]);
  });

  it("adds surrounding tags", () => {
    testExtract([
      ["**Testing Close**", "Testing", "**Testing**"],
      ["__Testing Close__", "Testing", "__Testing__"],
      ["*Testing Close*", "Testing", "*Testing*"],
      ["_Testing Close_", "Testing", "_Testing_"],
      ["==Testing Close==", "Testing", "==Testing=="],
      ["~~Testing Close~~", "Testing", "~~Testing~~"],
      ["`Testing Close`", "Testing", "`Testing`"],
    ]);
  });

  it("handles multiple tags", () => {
    testExtract([
      ["**bold *italic* text**", "text", "**text**"],
      ["**bold *italic* text**", "bold", "**bold**"],
      ["**bold *italic* text**", "italic", "***italic***"],
      ["**bold *italic* text**", "*italic", "***italic***"],
      ["**bold *italic* text**", "italic*", "***italic***"],
      ["**bold *italic* text**", "*italic*", "***italic***"],
      ["**bold *italic* text**", "bold *italic", "**bold *italic***"],
      ["> * blockquote list", "list", "> * list"],
      ["> * blockquote *italic list*", "list", "> * *list*"],
      ["**bold** *italic* **bold2 *bolditalic***", "bold2", "**bold2**"],
      ["**bold** *italic* ***bolditalic***", "bolditalic", "***bolditalic***"],
    ]);
  });
});
