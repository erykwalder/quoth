import { EditorPosition } from "obsidian";
import {
  AfterPos,
  AfterString,
  PosRange,
  Range,
  StringRange,
  WholeString,
} from "./range";

export type Embed = {
  file: string;
  subpath: string;
  ranges: Range[];
  join: string;
  show: EmbedOptions;
  display: EmbedDisplay;
};

export const DEFAULT_JOIN = " ... ";

export type EmbedDisplay = "embedded" | "inline";
export const DEFAULT_DISPLAY: EmbedDisplay = "embedded";

export type EmbedOptions = {
  title: boolean;
  author: boolean;
};

export function serialize(embed: Embed): string {
  let ref = "```quoth\n";
  ref += `path: [[${embed.file}${embed.subpath}]]\n`;
  if (embed.ranges.length > 0) {
    ref += `ranges: ${embed.ranges.map((r) => r.toString()).join(", ")}\n`;
  }
  if (embed.join !== DEFAULT_JOIN) {
    ref += `join: ${JSON.stringify(embed.join)}\n`;
  }
  if (embed.display !== DEFAULT_DISPLAY) {
    ref += `display: ${embed.display}\n`;
  }
  if (embed.show.author || embed.show.title) {
    const show: string[] = [];
    if (embed.show.author) {
      show.push("author");
    }
    if (embed.show.title) {
      show.push("title");
    }
    ref += `show: ${show.join(", ")}\n`;
  }
  ref += "```";
  return ref;
}

export function parse(text: string): Embed {
  const embedData: Embed = {
    file: "",
    subpath: "",
    ranges: [],
    join: DEFAULT_JOIN,
    show: {
      title: false,
      author: false,
    },
    display: DEFAULT_DISPLAY,
  };

  // Match: settingName: setting value
  // g suffix: match all
  // m suffix: ^ and $ work line by line, not on the whole string
  const settingRegex = /^(\w+):\s*(.+?)\s*$/gm;
  let matches: string[];
  while ((matches = settingRegex.exec(text)) !== null) {
    const [, settingName, settingText] = matches;
    if (settingName in lineParsers) {
      lineParsers[settingName](settingText, embedData);
    }
  }

  return embedData;
}

type LineParser = (text: string, data: Embed) => void;
const lineParsers: { [key: string]: LineParser } = {
  path: (text: string, data: Embed) => {
    // Match: [[filename#heading#^blockid]]
    let match;
    if ((match = text.match(/^\[\[([^#|[\]^]+)((#[^#]+)*)\]\]$/))) {
      data.file = match[1];
      data.subpath = match[2];
    } else {
      throw new Error("invalid path line");
    }
  },
  file: (text: string, data: Embed) => {
    // Match: [[filename]]
    if (/^\[\[.+?\]\]$/.test(text)) {
      data.file = text.slice(2, -2);
    } else {
      throw new Error("invalid file line");
    }
  },
  heading: (text: string, data: Embed) => {
    // Match: #text#moretext
    if (/^(#[^#]+)+$/.test(text)) {
      data.subpath += text;
    } else {
      throw new Error("invalid heading line");
    }
  },
  block: (text: string, data: Embed) => {
    if (/^\^\w+$/.test(text)) {
      data.subpath += "#" + text;
    } else {
      throw new Error("invalid block line");
    }
  },
  ranges: (text: string, data: Embed) => {
    // Match: "string" | 10:15 | to | ,
    // g suffix: match all
    const tokenRegex = /"([^"\\]|\\.)+"|\d+:\d+|to|after|,/g;
    data.ranges = [];
    const tokens: string[] = [];

    let matches: string[];
    while ((matches = tokenRegex.exec(text)) !== null) {
      tokens.push(matches[0]);
    }

    while (tokens.length > 0) {
      data.ranges.push(parseRange(tokens));
      if (tokens.length > 0) {
        if (tokens[0] == ",") {
          tokens.shift();
        } else {
          throw new Error("range syntax error");
        }
      }
    }
  },
  join: (text: string, data: Embed) => {
    // Match: "text"
    if (/^"([^"\\]|\\.)+"$/.test(text)) {
      data.join = JSON.parse(text) as string;
    } else {
      throw new Error("invalid join line");
    }
  },
  show: (text: string, data: Embed) => {
    // Match: word, another, final
    // g suffix: match all
    const showRegex = /(^|,)\s*([a-z]+)\s*/g;
    let matches: string[];
    while ((matches = showRegex.exec(text)) !== null) {
      const toggle = matches[2] as keyof EmbedOptions;
      if (toggle in data.show) {
        data.show[toggle] = true;
      } else {
        throw new Error("invalid show option");
      }
    }
  },
  display: (text: string, data: Embed) => {
    // Match: embedded | inline
    if (/^embedded|inline$/.test(text)) {
      data.display = text as "embedded" | "inline";
    } else {
      throw new Error("invalid display line");
    }
  },
};

function parseRange(tokens: string[]): Range {
  const cur = tokens[0];
  if (cur === "after") {
    return parseAfterRange(tokens);
  } else if (cur[0] === '"') {
    return parseStringRange(tokens);
  } else {
    return parsePosRange(tokens);
  }
}

function parseAfterRange(tokens: string[]): Range {
  tokens.shift();
  if (tokens[0][0] === '"') {
    return new AfterString(JSON.parse(tokens.shift()) as string);
  } else {
    return new AfterPos(parsePos(tokens.shift()));
  }
}

function parseStringRange(tokens: string[]): Range {
  const start = JSON.parse(tokens.shift()) as string;
  if (tokens.length === 0 || tokens[0] === ",") {
    return new WholeString(start);
  }
  if (tokens.shift() !== "to") {
    throw new Error("invalid ranges line");
  }
  const end = JSON.parse(tokens.shift()) as string;
  return new StringRange(start, end);
}

function parsePosRange(tokens: string[]): PosRange {
  const start = parsePos(tokens.shift());
  if (tokens.shift() !== "to") {
    throw new Error("invalid ranges line");
  }
  const end = parsePos(tokens.shift());
  return new PosRange(start, end);
}

function parsePos(token: string): EditorPosition {
  const parts = token.split(":");
  if (parts.length !== 2) {
    throw new Error("invalid ranges line");
  }
  const [line, ch] = parts.map((n) => parseInt(n));
  return { line, ch };
}
