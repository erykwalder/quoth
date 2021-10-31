import { clipboard } from "electron";
import { Editor, Plugin, TFile } from "obsidian";
import { getHeadingContentRange, getParentHeadings } from "./headings";
import { Range, PosRange, StringRange, WholeString } from "./range";
import { isUnique, uniqueStrRange } from "./stringSearch";

export function copyEditorReference(
  plugin: Plugin,
  checking: boolean,
  editor: Editor
) {
  if (!checking) {
    const file = plugin.app.workspace.getActiveFile();
    let posRange = PosRange.fromEditorSelection(editor.listSelections()[0]);
    const parents = getParentHeadings(
      plugin.app.metadataCache.getFileCache(file).headings,
      posRange
    );
    let text = editor.getValue();
    if (parents.length > 0) {
      const lastParent = parents[parents.length - 1];
      const offsets = getHeadingContentRange(
        lastParent,
        plugin.app.metadataCache.getFileCache(file).headings,
        text.length
      );
      text = text.slice(offsets.start, offsets.end);
      posRange.start.line -= lastParent.position.start.line;
      posRange.end.line -= lastParent.position.start.line;
    }
    const range = getBestRange(text, editor.getSelection(), posRange);

    clipboard.writeText(
      buildReference(
        file,
        parents.map((h) => h.heading),
        range
      )
    );
  }

  return editor.somethingSelected();
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
