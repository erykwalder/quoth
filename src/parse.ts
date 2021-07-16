export interface Embed {
  file?: string;
  heading?: string;
  block?: string;
  ranges?: EmbedRange[];
  show?: EmbedOptions[];
  display?: DisplayOptions;
}

export interface EmbedRange {
  start: Pos | string;
  end: Pos | string;
}

export interface Pos {
  line: number;
  col: number;
}

export enum EmbedOptions {
  TITLE,
  AUTHOR,
  CREATED,
}

export enum DisplayOptions {
  EMBEDDED,
  INLINE,
}

type LineParser = (text: string, data: Embed) => void;

const lineParsers: { [key: string]: LineParser } = {
  file: (text: string, data: Embed) => {
    // Match: [[text]]
    if (/^\[\[.+?\]\]$/.test(text)) {
      data.file = text;
    }
  },
  heading: (text: string, data: Embed) => {
    // Match: #text
    if (/^#.+?$/.test(text)) {
      data.heading = text;
    }
  },
};

// Match: settingName: setting value
// g suffix: match all
// m suffix: ^ and $ work line by line, not on the whole string
const SETTING_REGEX = /^(\w+):\s*(.+?)\s*$/gm;

export const parse = (text: string): Embed => {
  const embedData: Embed = {};

  let matches: string[];
  while ((matches = SETTING_REGEX.exec(text)) !== null) {
    const [_, settingName, settingText] = matches;
    if (settingName in lineParsers) {
      lineParsers[settingName](settingText, embedData);
    }
  }

  return embedData;
};
