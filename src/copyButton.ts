import { App, MarkdownView, setIcon } from "obsidian";
import { isTextSelected } from "./selection";
import { CopySettings, checkCopyReference } from "./copyReference";

export default function copyButton(app: App, settings: CopySettings): void {
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
        checkCopyReference(app, settings, false);
        button.remove();
      });
    }
  } else if (view?.getMode() === "preview") {
    view.previewMode.containerEl
      .querySelectorAll(".quoth-copy-button")
      .forEach((b) => b.remove());
  }
}
