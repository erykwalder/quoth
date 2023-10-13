import { MarkdownView, setIcon } from "obsidian";
import { CopySettings } from "./buildEmbed";
import { isTextSelected, clearSelection } from "./selection";
import { checkCopyReference } from "./copyReference";

export function copyButton(settings: CopySettings): void {
  if (!settings.showMobileButton) {
    return;
  }
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (view?.getMode() === "preview" && isTextSelected()) {
    if (!view.previewMode.containerEl.querySelector(".quoth-copy-button")) {
      const button =
        view.previewMode.containerEl.createDiv("quoth-copy-button");
      setIcon(button, "quoth-copy");
      button.addEventListener("click", () => {
        checkCopyReference(settings, false);
        clearSelection();
        removeAllButtons(view);
      });
    }
  } else if (view?.getMode() === "preview") {
    removeAllButtons(view);
  }
}

function removeAllButtons(view: MarkdownView) {
  view.previewMode.containerEl
    .querySelectorAll(".quoth-copy-button")
    .forEach((b) => b.remove());
}
