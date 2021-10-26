import {
  MarkdownPostProcessorContext,
  Plugin,
  MarkdownView,
  MarkdownRenderer,
} from "obsidian";
import { isPos, parse, Pos } from "./parse";
import { clipboard } from "electron";
import { indexOfLine } from "./stringSearch";

export default class RichEmbedsPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("quoth", quothProcessor);

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Reference",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.activeLeaf.view as MarkdownView;
        if (!checking) {
          if (view) {
            let ref = "```quoth\n";

            let selection = view.editor.listSelections()[0];
            let start = selection.anchor;
            let end = selection.head;
            if (
              start.line > end.line ||
              (start.line == end.line && start.ch > end.ch)
            ) {
              [start, end] = [end, start];
            }

            ref += `file: ${this.app.workspace.getActiveFile().path}\n`;
            ref += `ranges: ${start.line}:${start.ch} to ${end.line}:${end.ch}\n`;

            ref += "```";

            clipboard.writeText(ref);
          }
        }

        return view && view.editor.somethingSelected();
      },
    });
  }
}

async function quothProcessor(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  const embed = parse(source);
  const file = this.app.metadataCache.getFirstLinkpathDest(
    embed.file,
    ctx.sourcePath
  );
  if (!file) {
    return;
  }
  const fileData = await this.app.vault.cachedRead(file);
  const quote = embed.ranges
    .map((range) => {
      if (isPos(range.start) && isPos(range.end)) {
        return strRange(fileData, range.start, range.end);
      }
      return "Not implemented.";
    })
    .join(embed.join);
  MarkdownRenderer.renderMarkdown(quote, el, ctx.sourcePath, null);
}

function strRange(text: string, start: Pos, end: Pos): string {
  const startChr = indexOfLine(text, start.line) + start.col;
  const endChr = indexOfLine(text, end.line) + end.col;
  return text.substring(startChr, endChr);
}
