import { extractRangeWithContext, normalizeMarkdown } from "./markdown";
import { WholeString } from "./range";

Array.prototype.last = function (): unknown {
  if (this.length > 0) {
    return this[this.length - 1];
  }
  return undefined;
};

// text, matched range, result
type extractTest = [string, string, string];

function testExtract(cases: extractTest[]) {
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

// input, output
type normalizeTest = [string, string];

function testNormalize(cases: normalizeTest[]) {
  cases.forEach((c) => {
    expect(normalizeMarkdown(c[0])).toBe(c[1]);
  });
}

describe(normalizeMarkdown, () => {
  it("removes list bullets for single lines", () => {
    testNormalize([
      ["1. Testing", "Testing"],
      ["29. Testing", "Testing"],
      ["- Testing", "Testing"],
      ["+ Testing", "Testing"],
      ["* Testing", "Testing"],
    ]);
  });

  it("leaves list bullets for multiple lines", () => {
    testNormalize([
      ["1. Testing1\n2. Testing2", "1. Testing1\n2. Testing2"],
      ["29. Testing1\n30. Testing2", "29. Testing1\n30. Testing2"],
      ["- Testing1\n- Testing2", "- Testing1\n- Testing2"],
      ["+ Testing1\n+ Testing2", "+ Testing1\n+ Testing2"],
      ["* Testing1\n* Testing2", "* Testing1\n* Testing2"],
    ]);
  });

  it("removes headings for single lines", () => {
    testNormalize([
      ["# Testing", "Testing"],
      ["## Testing", "Testing"],
      ["### Testing", "Testing"],
      ["#### Testing", "Testing"],
      ["##### Testing", "Testing"],
      ["###### Testing", "Testing"],
    ]);
  });

  it("leaves headings for multiple lines", () => {
    testNormalize([
      ["# Testing1\nTesting2", "# Testing1\nTesting2"],
      ["## Testing1\nTesting2", "## Testing1\nTesting2"],
      ["### Testing1\nTesting2", "### Testing1\nTesting2"],
      ["#### Testing1\nTesting2", "#### Testing1\nTesting2"],
      ["##### Testing1\nTesting2", "##### Testing1\nTesting2"],
      ["###### Testing1\nTesting2", "###### Testing1\nTesting2"],
    ]);
  });

  it("removes redundant blockquotes", () => {
    testNormalize([
      [`> Testing`, "Testing"],
      ["> Testing1\n> Testing2", "Testing1\nTesting2"],
      ["> Testing1\n> Testing2\n> Testing3", "Testing1\nTesting2\nTesting3"],
      ["> Testing1\n> > Testing2", "Testing1\n> Testing2"],
      [
        "> > Testing1\n> Testing2\n> > Testing3",
        "> Testing1\nTesting2\n> Testing3",
      ],
    ]);
  });

  it("handles both lists and blockquotes", () => {
    testNormalize([
      [`> 1. Testing`, "Testing"],
      [`> + Testing`, "Testing"],
      [`> 1. Testing1\n> 2. Testing2`, "1. Testing1\n2. Testing2"],
    ]);
  });
});
