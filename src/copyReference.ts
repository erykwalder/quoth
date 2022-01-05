import {
  App,
  Editor,
  MarkdownView,
  Notice,
  resolveSubpath,
  TFile,
} from "obsidian";
import { getParentHeadings } from "./headings";
import { Range, PosRange, StringRange, WholeString } from "./range";
import { isUnique, uniqueStrRange } from "./stringSearch";
import getSelectedRange, { isTextSelected } from "./selection";
import { rangeRegex } from "./rangeRegex";
import { EmbedDisplay, EmbedOptions } from "./parse";

export interface CopySettings {
  defaultDisplay?: EmbedDisplay;
  defaultShow: EmbedOptions;
  showMobileButton: boolean;
}

interface refBuilder {
  app: App;
  settings: CopySettings;
  view: MarkdownView;
  editor: Editor;
  file: TFile;
  posRange?: PosRange;
  range?: Range;
  headings?: string[];
}

export function checkCopyReference(
  app: App,
  settings: CopySettings,
  checking: boolean
): boolean {
  const view = app.workspace.getActiveViewOfType(MarkdownView);

  if (!checking && view) {
    copyReference({
      app: app,
      settings: settings,
      view: view,
      editor: view.editor,
      file: view.file,
    });
  }

  return (
    (view?.getMode() === "source" && view.editor.somethingSelected()) ||
    (view?.getMode() === "preview" && isTextSelected())
  );
}

function copyReference(rb: refBuilder): void {
  try {
    if (rb.view.getMode() === "source") {
      rb.posRange = getSourceRange(rb);
    } else {
      rb.posRange = getPreviewRange(rb);
    }

    let text = rb.editor.getValue();
    const selectedText = rb.editor.getRange(rb.posRange.start, rb.posRange.end);

    const fileCache = rb.app.metadataCache.getFileCache(rb.file);
    const parents = getParentHeadings(fileCache.headings, rb.posRange);
    rb.headings = parents.map((h) => h.heading);
    if (parents.length > 0) {
      const subPath = resolveSubpath(fileCache, `#${rb.headings.join("#")}`);
      text = text.slice(subPath.start.offset, subPath.end?.offset);
      rb.posRange.start.line -= subPath.start.line;
      rb.posRange.end.line -= subPath.start.line;
    }

    rb.range = getBestRange(text, selectedText, rb.posRange);

    navigator.clipboard.writeText(buildReference(rb));
    new Notice("Reference copied!", 1500);
  } catch (e) {
    new Notice(e.message, 3000);
  }
}

function getSourceRange(rb: refBuilder): PosRange {
  return PosRange.fromEditorSelection(rb.editor.listSelections()[0]);
}

function getPreviewRange(rb: refBuilder): PosRange {
  const selectedRegex = rangeRegex(getSelectedRange());
  const match = rb.editor.getValue().match(selectedRegex);
  if (!match) {
    throw new Error(
      "Unable to locate markdown from preview, try copying from source mode."
    );
  }
  return new PosRange(
    rb.editor.offsetToPos(match.index),
    rb.editor.offsetToPos(match.index + match[0].length)
  );
}

function getBestRange(
  doc: string,
  selectedText: string,
  selectedRange: PosRange
): Range {
  if (isUnique(doc, selectedText)) {
    const points = uniqueStrRange(doc, selectedText);
    if (points.length === 1) {
      return new WholeString(points[0]);
    } else {
      return new StringRange(points[0], points[1]);
    }
  } else {
    return selectedRange;
  }
}

function buildReference(rb: refBuilder): string {
  let ref = "```quoth\n";
  ref += `file: [[${rb.file.path}]]\n`;
  if (rb?.headings.length > 0) {
    ref += `heading: #${rb.headings.join("#")}\n`;
  }
  ref += `ranges: ${rb.range.toString()}\n`;
  if (rb.settings.defaultDisplay) {
    ref += `display: ${rb.settings.defaultDisplay}\n`;
  }
  if (rb.settings.defaultShow.author || rb.settings.defaultShow.title) {
    const show: string[] = [];
    if (rb.settings.defaultShow.author) {
      show.push("author");
    }
    if (rb.settings.defaultShow.title) {
      show.push("title");
    }
    ref += `show: ${show.join(", ")}\n`;
  }
  ref += "```";
  return ref;
}
