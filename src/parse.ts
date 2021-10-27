export interface Embed {
  file?: string;
  heading?: string[];
  block?: string;
  ranges?: EmbedRange[];
  join: string;
  show: EmbedOptions;
  display: "embedded" | "inline";
}

export interface EmbedRange {
  start: Pos | string;
  end: Pos | string;
}

export interface Pos {
  line: number;
  col: number;
}

export function isPos(obj: any): obj is Pos {
  return obj instanceof Object && "line" in obj;
}

export interface EmbedOptions {
  title: boolean;
  author: boolean;
  created: boolean;
}

const parseRangeEndToken = (token: string): Pos | string => {
  if (token[0] === '"') {
    return JSON.parse(token) as string;
  }
  const nums = token.split(":");
  if (nums.length != 2) {
    throw new Error("invalid ranges line");
  }
  return {
    line: parseInt(nums[0]),
    col: parseInt(nums[1]),
  };
};

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

    let idx = 0;
    while (idx + 2 < tokens.length) {
      if (tokens[idx + 1] != "to") {
        throw new Error("invalid ranges line");
      }
      data.ranges.push({
        start: parseRangeEndToken(tokens[idx]),
        end: parseRangeEndToken(tokens[idx + 2]),
      });
      if (idx + 3 < tokens.length && tokens[idx + 3] != ",") {
        throw new Error("invalid ranges line");
      }
      idx += 4;
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
      created: false,
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
