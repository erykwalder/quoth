import {
  Editor,
  EditorRange,
  EditorSelection,
  MarkdownView,
  Notice,
} from "obsidian";
import { buildEmbed, CopySettings } from "./buildEmbed";
import { rangeRegex } from "./rangeRegex";
import { getSelectedRange, isTextSelected } from "./selection";

export function checkCopyReference(
  settings: CopySettings,
  checking: boolean
): boolean {
  const view = app.workspace.getActiveViewOfType(MarkdownView);

  if (!checking && view) {
    try {
      navigator.clipboard.writeText(
        buildEmbed(
          settings,
          view.file,
          view.editor.getValue(),
          getViewRange(view, view.editor)
        )
      );
      new Notice("Reference copied!", 1500);
    } catch (e) {
      new Notice(e, 3000);
    }
  }

  return (
    (view?.getMode() === "source" && view.editor.somethingSelected()) ||
    (view?.getMode() === "preview" && isTextSelected())
  );
}

function getViewRange(view: MarkdownView, editor: Editor) {
  if (view.getMode() === "source") {
    return getSourceRange(editor);
  } else {
    return getPreviewRange(editor);
  }
}

function getSourceRange(editor: Editor): EditorRange {
  if (!editor.somethingSelected()) {
    throw new Error("Nothing is selected");
  }
  return selectionToRange(editor.listSelections()[0]);
}

function getPreviewRange(editor: Editor): EditorRange {
  if (!isTextSelected()) {
    throw new Error("Nothing is selected");
  }
  const selectedRegex = rangeRegex(getSelectedRange());
  const match = editor.getValue().match(selectedRegex);
  if (!match) {
    throw new Error(
      "Unable to locate markdown from preview, try copying from source mode."
    );
  }
  return {
    from: editor.offsetToPos(match.index),
    to: editor.offsetToPos(match.index + match[0].length),
  };
}

function selectionToRange(sel: EditorSelection): EditorRange {
  let start = sel.anchor;
  let end = sel.head;
  if (start.line > end.line || (start.line == end.line && start.ch > end.ch)) {
    [start, end] = [end, start];
  }
  return { from: start, to: end };
}
