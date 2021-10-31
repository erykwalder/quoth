import {
  Keymap,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  Plugin,
  setIcon,
} from "obsidian";
import { findHeadingByPath, getHeadingContentRange } from "./headings";
import { Embed, parse } from "./parse";

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
      throw new Error(`File not found: ${embed.file}`);
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
      el = createEmbedWrapper(el, ctx.sourcePath, embed, (p, s, n) =>
        plugin.app.workspace.openLinkText(p, s, n)
      );
    }
    MarkdownRenderer.renderMarkdown(quote, el, ctx.sourcePath, null);
  } catch (e) {
    el.innerHTML = `<strong>Quoth Error: ${e}</strong>`;
  }
}

function createEmbedWrapper(
  el: HTMLElement,
  sourcePath: string,
  embed: Embed,
  openLink: (p: string, s: string, n: boolean) => Promise<void>
): HTMLElement {
  let path = [embed.file];
  if (embed.heading && embed.heading.length > 0) {
    path = path.concat(embed.heading);
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

  const mdLink = mdEmbed.createDiv({
    cls: "markdown-embed-link",
    attr: { "aria-label": "Open Link" },
  });
  setIcon(mdLink, "link", 20);
  mdLink.addEventListener("click", async (e) => {
    if (e.button === 0) {
      await openLink(path.join("#"), sourcePath, Keymap.isModEvent(e));
    }
  });

  return mdPrevSec.createDiv();
}
