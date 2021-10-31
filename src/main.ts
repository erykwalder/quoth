import {
  MarkdownPostProcessorContext,
  Plugin,
  MarkdownRenderer,
  TFile,
} from "obsidian";
import { parse } from "./parse";
import { copyEditorReference } from "./copyReference";
import { findHeadingByPath, getHeadingContentRange } from "./headings";

export default class QuothPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("quoth", quothProcessor);

    this.addCommand({
      id: "quoth-copy-reference",
      name: "Copy Reference",
      editorCheckCallback: copyEditorReference.bind(null, this),
      hotkeys: [
        {
          modifiers: ["Shift", "Mod"],
          key: "'",
        },
      ],
    });
  }
}

async function quothProcessor(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  try {
    const embed = parse(source);
    const file = this.app.metadataCache.getFirstLinkpathDest(
      embed.file,
      ctx.sourcePath
    );
    if (!file) {
      return;
    }
    let fileData = await this.app.vault.cachedRead(file);
    const headingCache = this.app.metadataCache.getFileCache(file).headings;
    if (embed.heading && headingCache && embed.heading.length > 0) {
      const parent = findHeadingByPath(embed.heading, headingCache);
      if (parent) {
        const offsets = getHeadingContentRange(
          parent,
          headingCache,
          fileData.length
        );
        fileData = fileData.slice(offsets.start, offsets.end);
      }
    }
    const quote = embed.ranges
      .map((range) => range.text(fileData))
      .join(embed.join);
    if (embed.display == "embedded") {
      el = createEmbedWrapper(el, file, embed.heading);
    }
    MarkdownRenderer.renderMarkdown(quote, el, ctx.sourcePath, null);
  } catch (e) {}
}

function createEmbedWrapper(
  el: HTMLElement,
  file: TFile,
  heading?: string[]
): HTMLElement {
  let path = [file.basename];
  if (heading && heading.length > 0) {
    path = path.concat(heading);
  }
  const span = el.createSpan({
    cls: "internal-embed is-loaded",
    attr: {
      alt: path.join(" > "),
      src: path.join("#"),
    },
  });
  const mdEmbed = span.createDiv({ cls: "markdown-embed" });
  const mdEmbedCont = mdEmbed.createDiv({ cls: "markdown-embed-content" });
  const mdPrev = mdEmbedCont.createDiv({ cls: "markdown-preview-view" });
  const mdPrevSec = mdPrev.createDiv({
    cls: "markdown-preview-sizer markdown-preview-section",
    attr: {
      style: "padding-bottom: 0px",
    },
  });
  mdPrevSec.createDiv({
    cls: "markdown-preview-pusher",
    attr: {
      style: "width: 1px; height: 0.1px; margin-bottom: 0px;",
    },
  });
  return mdPrevSec.createDiv();
}
