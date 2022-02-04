import { App, Editor, FuzzySuggestModal, Notice, TFile } from "obsidian";
import { buildEmbed, CopySettings } from "./buildEmbed";
import { escapeRegex } from "../util/escapeRegex";
import { indexPos } from "../util/stringSearch";

export async function replaceBlockquotes(
  app: App,
  settings: CopySettings,
  editor: Editor
): Promise<void> {
  const modal = new FileSuggester(app, async (sourceFile: TFile) => {
    let doc = editor.getValue();
    const matcher = /(?:(?:^|\n)>[^\n]+)+/gm;
    const sourceDoc = await app.vault.cachedRead(sourceFile);
    let replaced = 0;
    doc = doc.replace(matcher, (match) => {
      const sourceMatcher = new RegExp(
        escapeRegex(match.replace(/(^|\n)>/g, "$1"))
          .trim()
          .replace(/\s+/g, "\\s*"),
        "m"
      );
      const sourceMatch = sourceDoc.match(sourceMatcher);
      if (sourceMatch) {
        replaced += 1;
        return (
          "\n" +
          buildEmbed(app, settings, sourceFile, sourceDoc, {
            from: indexPos(sourceDoc, sourceMatch.index),
            to: indexPos(sourceDoc, sourceMatch.index + sourceMatch[0].length),
          })
        );
      }
      return match;
    });
    if (replaced > 0) {
      editor.setValue(doc);
      new Notice(
        `Replaced ${replaced} blockquote${replaced > 1 ? "s" : ""}` +
          ` with quoth embeds from ${sourceFile.basename}`,
        3000
      );
    } else {
      new Notice(
        `Unable to locate any quotes to replace in ${sourceFile.basename}`,
        3000
      );
    }
  });
  modal.open();
}

class FileSuggester extends FuzzySuggestModal<TFile> {
  constructor(public app: App, private cb: (file: TFile) => void) {
    super(app);
    this.setPlaceholder("Type source filename...");
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  getItemText(item: TFile): string {
    return item.basename;
  }

  onChooseItem(item: TFile): void {
    this.cb(item);
  }
}
