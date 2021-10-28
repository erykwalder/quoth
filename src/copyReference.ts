import { clipboard } from "electron";
import { Editor, Plugin, TFile } from "obsidian";
import { Range, PosRange, StringRange } from "./range";
import { isRepeated, uniqueStrRange } from "./stringSearch";

export function copyEditorReference(
  plugin: Plugin,
  checking: boolean,
  editor: Editor
) {
  if (!checking) {
    const range = getBestRange(editor.getValue(), editor);

    clipboard.writeText(
      buildReference(plugin.app.workspace.getActiveFile(), range)
    );
  }

  return editor.somethingSelected();
}

function getBestRange(doc: string, editor: Editor): Range {
  if (!isRepeated(doc, editor.getSelection())) {
    const points = uniqueStrRange(doc, editor.getSelection());
    return new StringRange(points[0], points[1]);
  } else {
    return PosRange.fromEditorSelection(editor.listSelections()[0]);
  }
}

function buildReference(file: TFile, range: Range): string {
  let ref = "```quoth\n";
  ref += `file: [[${file.path}]]\n`;
  ref += `ranges: ${range.toString()}\n`;
  ref += "```";
  return ref;
}
