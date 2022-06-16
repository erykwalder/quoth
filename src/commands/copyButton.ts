import { MarkdownView, setIcon } from "obsidian";
import { CopySettings } from "./buildEmbed";
import { isTextSelected } from "./selection";
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
      setIcon(button, "quoth-copy", 30);
      button.addEventListener("click", () => {
        checkCopyReference(settings, false);
        button.remove();
      });
    }
  } else if (view?.getMode() === "preview") {
    view.previewMode.containerEl
      .querySelectorAll(".quoth-copy-button")
      .forEach((b) => b.remove());
  }
}
