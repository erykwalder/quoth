import { EditorRange, resolveSubpath, TFile } from "obsidian";
import {
  DEFAULT_DISPLAY,
  DEFAULT_JOIN,
  Embed,
  EmbedDisplay,
  EmbedOptions,
  serialize,
} from "../model/embed";
import {
  posIndex,
  PosRange,
  Range,
  StringRange,
  WholeString,
} from "../model/range";
import { isUnique, uniqueStrRange } from "../util/stringSearch";
import { scopeSubpath } from "../util/obsidian/subpath";

export interface CopySettings {
  defaultDisplay?: EmbedDisplay;
  defaultShow: EmbedOptions;
  showMobileButton: boolean;
}

export function buildEmbed(
  settings: CopySettings,
  file: TFile,
  text: string,
  editorRange: EditorRange
): string {
  const selectedText = text.slice(
    posIndex(text, editorRange.from),
    posIndex(text, editorRange.to)
  );

  const fileCache = app.metadataCache.getFileCache(file);
  const subpath = scopeSubpath(fileCache, editorRange);
  if (subpath.length > 0) {
    const subpathResult = resolveSubpath(fileCache, subpath);
    text = text.slice(subpathResult.start.offset, subpathResult.end?.offset);
    editorRange.from.line -= subpathResult.start.line;
    editorRange.to.line -= subpathResult.start.line;
  }

  const range = getBestRange(text, selectedText, editorRange);

  const embed: Embed = {
    file: app.metadataCache.fileToLinktext(file, "/", true),
    subpath: subpath,
    ranges: [],
    join: DEFAULT_JOIN,
    show: {
      author: false,
      title: false,
      ...settings.defaultShow,
    },
    display: settings.defaultDisplay || DEFAULT_DISPLAY,
  };
  if (range) {
    embed.ranges.push(range);
  }
  return serialize(embed);
}

function getBestRange(
  doc: string,
  selectedText: string,
  selectedRange: EditorRange
): Range {
  if (doc === selectedText) {
    return null;
  }
  if (isUnique(doc, selectedText)) {
    const points = uniqueStrRange(doc, selectedText);
    if (points.length === 1) {
      return new WholeString(points[0]);
    } else {
      return new StringRange(points[0], points[1]);
    }
  } else {
    return new PosRange(selectedRange.from, selectedRange.to);
  }
}
