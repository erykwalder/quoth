import { clipboard } from "electron";
import { MarkdownView } from "obsidian";
import { isRepeated, uniqueStrRange } from "./stringSearch";

export default function copyReference(checking: boolean) {
  const view = this.app.workspace.activeLeaf.view as MarkdownView;
  if (!checking) {
    if (view) {
      let ref = "```quoth\n";
      ref += `file: [[${this.app.workspace.getActiveFile().path}]]\n`;

      const selectedText = view.editor.getSelection();

      if (!isRepeated(view.editor.getValue(), selectedText)) {
        const points = uniqueStrRange(view.editor.getValue(), selectedText);
        ref += `ranges: ${points.map((p) => JSON.stringify(p)).join(" to ")}\n`;
      } else {
        const selection = view.editor.listSelections()[0];
        let start = selection.anchor;
        let end = selection.head;
        if (
          start.line > end.line ||
          (start.line == end.line && start.ch > end.ch)
        ) {
          [start, end] = [end, start];
        }
        ref += `ranges: ${start.line}:${start.ch} to ${end.line}:${end.ch}\n`;
      }

      ref += "```";

      clipboard.writeText(ref);
    }
  }

  return view && view.editor.somethingSelected();
}
