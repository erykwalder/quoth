import { clipboard } from "electron";
import { Editor, EditorSelection, Plugin, TFile } from "obsidian";
import { PosRange } from "./parse";
import { isRepeated, uniqueStrRange } from "./stringSearch";

export function copyEditorReference(
  plugin: Plugin,
  checking: boolean,
  editor: Editor
) {
  if (!checking) {
    clipboard.writeText(
      buildReference(
        plugin.app.workspace.getActiveFile(),
        editor.getValue(),
        editor.getSelection(),
        selectionToPosRange(editor.listSelections()[0])
      )
    );
  }

  return editor.somethingSelected();
}

function buildReference(
  file: TFile,
  doc: string,
  text: string,
  range: PosRange
): string {
  let ref = "```quoth\n";
  ref += `file: [[${file.path}]]\n`;

  if (!isRepeated(doc, text)) {
    const points = uniqueStrRange(doc, text);
    ref += `ranges: ${points.map((p) => JSON.stringify(p)).join(" to ")}\n`;
  } else {
    ref += `ranges: ${range.start.line}:${range.start.col} to ${range.end.line}:${range.end.col}\n`;
  }

  ref += "```";
  return ref;
}

function selectionToPosRange(selection: EditorSelection): PosRange {
  let start = selection.anchor;
  let end = selection.head;
  if (start.line > end.line || (start.line == end.line && start.ch > end.ch)) {
    [start, end] = [end, start];
  }
  return {
    start: { line: start.line, col: start.ch },
    end: { line: end.line, col: end.ch },
  };
}
