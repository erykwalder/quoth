import {
  MarkdownPostProcessorContext,
  Plugin,
  MarkdownView,
  MarkdownPreviewView,
  MarkdownRenderer,
} from "obsidian";
import { EmbedRange, isPos, parse, Pos } from "./parse";
import { clipboard } from "electron";

export default class RichEmbedsPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("quoth", quothProcessor);

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Quoth Reference",
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

function strRange(str: string, start: Pos, end: Pos): string {
  let startChr = 0;
  let endChr = 0;
  let idx = -1;
  for (let line = 1; (idx = str.indexOf("\n", idx + 1)); line++) {
    if (line == start.line) {
      startChr = idx + start.col + 1;
    }
    if (line == end.line) {
      endChr = idx + end.col + 1;
      break;
    }
  }
  return str.substring(startChr, endChr);
}
