import { Range, Pos, PosRange, StringRange, WholeString } from "./range";

export type Embed = {
  file?: string;
  heading?: string[];
  block?: string;
  ranges?: Range[];
  join: string;
  show: EmbedOptions;
  display: "embedded" | "inline";
};

export type EmbedOptions = {
  title: boolean;
  author: boolean;
};

function parseRange(tokens: string[]): Range {
  const cur = tokens[0];
  if (cur[0] === '"') {
    return parseStringRange(tokens);
  } else {
    return parsePosRange(tokens);
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

function parsePos(token: string): Pos {
  const parts = token.split(":");
  if (parts.length !== 2) {
    throw new Error("invalid ranges line");
  }
  const [line, col] = parts.map((n) => parseInt(n));
  return { line, col };
}

type LineParser = (text: string, data: Embed) => void;

const lineParsers: { [key: string]: LineParser } = {
  file: (text: string, data: Embed) => {
    // Match: [[filename]]
    if (/^\[\[.+?\]\]$/.test(text)) {
      data.file = text.slice(2, -2);
    } else {
      throw new Error("invalid file line");
    }
  },
  heading: (text: string, data: Embed) => {
    // Match: #text
    const headingRegex = /#([^#]+)/g;
    const headings: string[] = [];
    let matches: string[];
    while ((matches = headingRegex.exec(text)) !== null) {
      headings.push(matches[1]);
    }
    if (headings.length > 0) {
      data.heading = headings;
    }
  },
  block: (text: string, data: Embed) => {
    // Match: ^text
    if (/^\^.+?$/.test(text)) {
      data.block = text;
    } else {
      throw new Error("invalid block line");
    }
  },
  ranges: (text: string, data: Embed) => {
    // Match: "string" | 10:15 | to | ,
    // g suffix: match all
    const tokenRegex = /"([^"\\]|\\.)+"|\d+:\d+|to|,/g;
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
    if (/^\"([^"\\]|\\.)+\"$/.test(text)) {
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

export const parse = (text: string): Embed => {
  // Match: settingName: setting value
  // g suffix: match all
  // m suffix: ^ and $ work line by line, not on the whole string
  const settingRegex = /^(\w+):\s*(.+?)\s*$/gm;

  const embedData: Embed = {
    join: " ... ",
    show: {
      title: false,
      author: false,
    },
    display: "embedded",
  };

  let matches: string[];
  while ((matches = settingRegex.exec(text)) !== null) {
    const [_, settingName, settingText] = matches;
    if (settingName in lineParsers) {
      lineParsers[settingName](settingText, embedData);
    }
  }

  return embedData;
};
