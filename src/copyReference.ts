import { App, htmlToMarkdown, MarkdownView, TFile } from "obsidian";
import { getHeadingContentRange, getParentHeadings } from "./headings";
import { Range, PosRange, StringRange, WholeString } from "./range";
import { isUnique, uniqueStrRange } from "./stringSearch";
import getSelectedRange, { getRangeHTML, isTextSelected } from "./selection";

export function copyReference(app: App, checking: boolean) {
  const view = app.workspace.activeLeaf?.getViewState()?.type;
  const mode = app.workspace.activeLeaf?.getViewState()?.state?.mode;

  if (view === "markdown" && mode === "source") {
    return copySourceReference(app, checking);
  } else if (view === "markdown" && mode == "preview") {
    return copyPreviewReference(app, checking);
  }
  return false;
}

function copySourceReference(app: App, checking: boolean) {
  const editor = (app.workspace.activeLeaf.view as MarkdownView).editor;
  if (!checking) {
    copySelection(
      app,
      PosRange.fromEditorSelection(editor.listSelections()[0]),
      editor.getSelection(),
      editor.getValue()
    );
  }

  return editor.somethingSelected();
}

function copyPreviewReference(app: App, checking: boolean) {
  if (!checking) {
    const editor = (app.workspace.activeLeaf.view as MarkdownView).editor;
    const text = editor.getValue();
    const selectedText = htmlToMarkdown(getRangeHTML(getSelectedRange()));
    const startOffset = text.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;
    const startPos = editor.offsetToPos(startOffset);
    const endPos = editor.offsetToPos(endOffset);
    copySelection(
      app,
      new PosRange(
        { line: startPos.line, col: startPos.ch },
        { line: endPos.line, col: endPos.ch }
      ),
      selectedText,
      text
    );
  }

  return isTextSelected();
}

function copySelection(
  app: App,
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

function buildReference(file: TFile, parents: string[], range: Range): string {
  let ref = "```quoth\n";
  ref += `file: [[${file.path}]]\n`;
  if (parents.length > 0) {
    ref += `heading: #${parents.join("#")}\n`;
  }
  ref += `ranges: ${range.toString()}\n`;
  ref += "```";
  return ref;
}
