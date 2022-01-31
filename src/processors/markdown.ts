import { Range } from "../model/range";

interface MarkdownToken {
  type: "linestart" | "surrounding" | "text";
  matcher: string;
}

interface MatchedToken {
  token: MarkdownToken;
  text: string;
}

const BlockQuoteToken: MarkdownToken = {
  type: "linestart",
  matcher: ">( |\\t)?",
};
const HeadingToken: MarkdownToken = {
  type: "linestart",
  matcher: "#{1,6}( |\\t)",
};
const ListItemToken: MarkdownToken = {
  type: "linestart",
  // without knowing the previous line
  // it is impossible to know if leading space
  // is an indented bullet or a code block
  matcher: "(( |\t)*(\\d+[.)])|[+*-])( |\\t)",
};
const CodeLineToken: MarkdownToken = {
  type: "linestart",
  matcher: " {4}|\\t",
};
const StrongToken: MarkdownToken = {
  type: "surrounding",
  matcher: "\\*\\*|__",
};
const StrikeToken: MarkdownToken = { type: "surrounding", matcher: "~~" };
const MarkToken: MarkdownToken = { type: "surrounding", matcher: "==" };
const EmToken: MarkdownToken = { type: "surrounding", matcher: "[*_]" };
const CodeToken: MarkdownToken = { type: "surrounding", matcher: "`" };
const TextToken: MarkdownToken = { type: "text", matcher: "." };

// Tokens are listed in order of matching priority
const tokenList: MarkdownToken[] = [
  BlockQuoteToken,
  HeadingToken,
  ListItemToken,
  CodeLineToken,
  StrongToken,
  StrikeToken,
  MarkToken,
  EmToken,
  CodeToken,
  TextToken,
];

export function extractRangeWithContext(text: string, range: Range): string {
  const { start, end } = range.indexes(text);
  return (
    markdownPrefix(text, start) +
    text.slice(start, end) +
    markdownSuffix(text, end)
  );
}

function markdownPrefix(text: string, start: number): string {
  const startLine = text.slice(text.lastIndexOf("\n", start) + 1, start);
  const tokens = tokenize(startLine);
  return joinTokens(startTokens(tokens).concat(openTokens(tokens)));
}

function markdownSuffix(text: string, end: number): string {
  const endLine = text.slice(text.lastIndexOf("\n", end) + 1, end);
  return joinTokens(openTokens(tokenize(endLine)).reverse());
}

export function normalizeMarkdown(text: string): string {
  let parts: string[] = text.split("\n");

  // Remove blockquotes and spaces up to the minimum per line
  while (parts[0].length > 0) {
    while (all(parts, (p) => /^ |\t/.test(p))) {
      parts = parts.map((p) => p.slice(1));
    }
    if (all(parts, (p) => startsWithToken(p, BlockQuoteToken))) {
      parts = parts.map((p) => sliceToken(p, BlockQuoteToken)[0]);
    } else {
      break;
    }
  }

  // Remove bullet point or heading if there's only one line
  if (parts.length === 1) {
    if (startsWithToken(parts[0], ListItemToken)) {
      parts[0] = sliceToken(parts[0], ListItemToken)[0];
    }
    if (startsWithToken(parts[0], HeadingToken)) {
      parts[0] = sliceToken(parts[0], HeadingToken)[0];
    }
  }

  return parts.join("\n");
}

function startTokens(tokens: MatchedToken[]): MatchedToken[] {
  return tokens.filter((t) => t.token.type === "linestart");
}

function openTokens(tokens: MatchedToken[]): MatchedToken[] {
  const open: MatchedToken[] = [];
  tokens
    .filter((t) => t.token.type === "surrounding")
    .forEach((t) => {
      if (open.last()?.text === t.text) {
        open.pop();
      } else {
        open.push(t);
      }
    });
  return open;
}

function tokenize(str: string): MatchedToken[] {
  let matchLineStart = true;
  let matchers = tokenList;
  const tokens: MatchedToken[] = [];
  while (str.length > 0) {
    const token = matchers.find((t) => startsWithToken(str, t));
    let match: string;
    [str, match] = sliceToken(str, token);
    if (token === TextToken && tokens.last()?.token === TextToken) {
      tokens.last().text += match;
    } else {
      tokens.push({ token: token, text: match });
    }
    if (token.type !== "linestart" && matchLineStart) {
      matchLineStart = false;
      matchers = matchers.filter((m) => m.type !== "linestart");
    }
  }
  return tokens;
}

function all(array: string[], f: (item: string) => boolean): boolean {
  return array.filter(f).length === array.length;
}

function startsWithToken(text: string, token: MarkdownToken): boolean {
  return new RegExp("^" + token.matcher).test(text);
}

function sliceToken(text: string, token: MarkdownToken): [string, string] {
  const match = text.match(new RegExp("^" + token.matcher));
  return [text.slice(match[0].length), match[0]];
}

function joinTokens(tokens: MatchedToken[]): string {
  return tokens.map((t) => t.text).join("");
}
