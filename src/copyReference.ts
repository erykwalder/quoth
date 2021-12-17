import { App, htmlToMarkdown, MarkdownView, Notice, TFile } from "obsidian";
import { getHeadingContentRange, getParentHeadings } from "./headings";
import { Range, PosRange, StringRange, WholeString } from "./range";
import { isUnique, uniqueStrRange } from "./stringSearch";
import getSelectedRange, { getRangeHTML, isTextSelected } from "./selection";
import { EmbedDisplay, EmbedOptions } from "./parse";

export interface CopySettings {
  defaultDisplay?: EmbedDisplay;
  defaultShow: EmbedOptions;
}

export function copyReference(
  app: App,
  settings: CopySettings,
  checking: boolean
) {
  const mode = app.workspace.getActiveViewOfType(MarkdownView)?.getMode();

  try {
    if (mode === "source") {
      return copySourceReference(app, settings, checking);
    } else if (mode == "preview") {
      return copyPreviewReference(app, settings, checking);
    }
  } catch (e) {
    new Notice(e.message, 3000);
  }
  return false;
}

function copySourceReference(
  app: App,
  settings: CopySettings,
  checking: boolean
) {
  const editor = app.workspace.getActiveViewOfType(MarkdownView).editor;
  if (!checking) {
    copySelection(
      app,
      settings,
      PosRange.fromEditorSelection(editor.listSelections()[0]),
      editor.getSelection(),
      editor.getValue()
    );
  }

  return editor.somethingSelected();
}

function copyPreviewReference(
  app: App,
  settings: CopySettings,
  checking: boolean
) {
  if (!checking) {
    const editor = app.workspace.getActiveViewOfType(MarkdownView).editor;
    const text = editor.getValue();
    const selectedText = htmlToMarkdown(getRangeHTML(getSelectedRange()));
    const startOffset = text.indexOf(selectedText);
    if (startOffset == -1) {
      throw new Error(
        "Unable to locate markdown from preview, try copying from source mode."
      );
    }
    const endOffset = startOffset + selectedText.length;
    copySelection(
      app,
      settings,
      new PosRange(
        editor.offsetToPos(startOffset),
        editor.offsetToPos(endOffset)
      ),
      selectedText,
      text
    );
  }

  return isTextSelected();
}

function copySelection(
  app: App,
  settings: CopySettings,
  posRange: PosRange,
  selectedText: string,
  text: string
) {
  const file = app.workspace.getActiveFile();
  const parents = getParentHeadings(
    app.metadataCache.getFileCache(file).headings,
    posRange
  );
  if (parents.length > 0) {
    const lastParent = parents.last();
    const offsets = getHeadingContentRange(
      lastParent,
      app.metadataCache.getFileCache(file).headings,
      text.length
    );
    text = text.slice(offsets.start, offsets.end);
    posRange.start.line -= lastParent.position.start.line;
    posRange.end.line -= lastParent.position.start.line;
  }
  const range = getBestRange(text, selectedText, posRange);

  navigator.clipboard.writeText(
    buildReference(
      settings,
      file,
      parents.map((h) => h.heading),
      range
    )
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

function buildReference(
  settings: CopySettings,
  file: TFile,
  parents: string[],
  range: Range
): string {
  let ref = "```quoth\n";
  ref += `file: [[${file.path}]]\n`;
  if (parents.length > 0) {
    ref += `heading: #${parents.join("#")}\n`;
  }
  ref += `ranges: ${range.toString()}\n`;
  if (settings.defaultDisplay) {
    ref += `display: ${settings.defaultDisplay}\n`;
  }
  if (settings.defaultShow.author || settings.defaultShow.title) {
    const show: string[] = [];
    if (settings.defaultShow.author) {
      show.push("author");
    }
    if (settings.defaultShow.title) {
      show.push("title");
    }
    ref += `show: ${show.join(", ")}\n`;
  }
  ref += "```";
  return ref;
}
