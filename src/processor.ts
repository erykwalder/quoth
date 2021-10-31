import {
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
  TFile,
} from "obsidian";
import { findHeadingByPath, getHeadingContentRange } from "./headings";
import { parse } from "./parse";

export async function quothProcessor(
  plugin: Plugin,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  try {
    const embed = parse(source);
    const file = plugin.app.metadataCache.getFirstLinkpathDest(
      embed.file,
      ctx.sourcePath
    );
    if (!file) {
      return;
    }
    let fileData = await plugin.app.vault.cachedRead(file);
    const headingCache = plugin.app.metadataCache.getFileCache(file).headings;
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
