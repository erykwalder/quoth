/**
 * @jest-environment jsdom
 */

import { rangeRegex } from "./rangeRegex";

const html = `
<div><p id="p1">Simple plaintext.</p></div>
<div><p id="p2">More plaintext.</p></div>
<div><p id="p3"><strong>A paragraph <em>that has both</em> bold</strong> and <em>italic</em> text.</p></div>
`;

interface pos {
  node: Node;
  offset: number;
}

interface testCase {
  start: pos;
  end: pos;
  result: RegExp;
}

describe(rangeRegex, () => {
  const dom = document.createElement("div");
  dom.innerHTML = html;

  function el(matcher: string): Element {
    return dom.querySelector(matcher);
  }

  function testRanges(cases: testCase[]) {
    cases.forEach((c) => {
      const range = document.createRange();
      range.setStart(c.start.node, c.start.offset);
      range.setEnd(c.end.node, c.end.offset);
      expect(rangeRegex(range)).toStrictEqual(c.result);
    });
  }

  it("returns plaintext for text range", () => {
    testRanges([
      {
        start: { node: el("#p1").firstChild, offset: 0 },
        end: { node: el("#p1").firstChild, offset: 17 },
        result: /Simple\s+plaintext\./ms,
      },
      {
        start: { node: el("#p1").firstChild, offset: 7 },
        end: { node: el("#p1").firstChild, offset: 16 },
        result: /plaintext/ms,
      },
      {
        start: { node: el("#p3").lastChild, offset: 0 },
        end: { node: el("#p3").lastChild, offset: 6 },
        result: /text\./ms,
      },
    ]);
  });

  it("returns plaintext for paragraph with one text child", () => {
    testRanges([
      {
        start: { node: el("#p1"), offset: 0 },
        end: { node: el("#p1"), offset: 1 },
        result: /Simple\s+plaintext\./ms,
      },
    ]);
  });

  it("works across multiple elements", () => {
    testRanges([
      {
        start: { node: el("#p1").firstChild, offset: 0 },
        end: { node: el("#p2").firstChild, offset: 4 },
        result:
          /Simple\s+plaintext\.(<\/?[A-Za-z]+>|[^A-Za-z])*?\s+(<\/?[A-Za-z]+>|[^A-Za-z])*?More/ms,
      },
    ]);
  });

  it("adds prefixes and suffixes for surrounding els", () => {
    testRanges([
      {
        start: { node: el("#p3 > strong").firstChild, offset: 0 },
        end: { node: el("#p3 > strong > em").firstChild, offset: 13 },
        result:
          /((\*\*|__)\s*?)?A\s+paragraph\s+(<\/?[A-Za-z]+>|[^A-Za-z])*?that\s+has\s+both(\s*?([*_]))?/ms,
      },
    ]);
  });
});
