import {
  App,
  HeadingCache,
  Keymap,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  setIcon,
  Workspace,
} from "obsidian";
import { findHeadingByPath, getHeadingContentRange } from "./headings";
import { Embed, EmbedDisplay, EmbedOptions, parse } from "./parse";

interface Quote {
  file: string;
  headings: string[];
  markdown: string;
  title: string;
  author?: string;
}

export async function quothProcessor(
  app: App,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext
) {
  try {
    const embed = parse(source);
    const quote = await assembleQuote(app, ctx.sourcePath, embed);
    renderQuote(
      app.workspace,
      el,
      ctx.sourcePath,
      quote,
      embed.display,
      embed.show
    );
  } catch (e) {
    renderError(el, e);
  }
}

async function assembleQuote(
  app: App,
  source: string,
  embed: Embed
): Promise<Quote> {
  const file = app.metadataCache.getFirstLinkpathDest(embed.file, source);
  if (!file) {
    throw new Error(`File not found: ${embed.file}`);
  }
  const fileCache = app.metadataCache.getFileCache(file);
  const text = headingContent(
    await app.vault.cachedRead(file),
    fileCache.headings,
    embed.heading
  );
  let quote: string;
  if (embed.ranges.length > 0) {
    quote = embed.ranges.map((range) => range.text(text)).join(embed.join);
  } else {
    quote = text;
  }
  return {
    file: embed.file,
    headings: embed.heading || [],
    markdown: quote,
    title: file.basename,
    author: fileCache.frontmatter?.author as string,
  };
}

function headingContent(
  data: string,
  cache: HeadingCache[] | null,
  path: string[] | null
) {
  if (cache && path?.length > 0) {
    const parent = findHeadingByPath(path, cache);
    if (parent) {
      const offsets = getHeadingContentRange(parent, cache, data.length);
      return data.slice(offsets.start, offsets.end);
    }
  }
  return data;
}

function renderQuote(
  workspace: Workspace,
  el: HTMLElement,
  source: string,
  quote: Quote,
  display: EmbedDisplay,
  show: EmbedOptions
) {
  if (display == "embedded") {
    el = createEmbedWrapper(el, source, quote, (p, s, n) =>
      workspace.openLinkText(p, s, n)
    );
  }
  if (quote.markdown.includes("```quoth")) {
    throw new Error("Can not quote a quoth code block.");
  }
  MarkdownRenderer.renderMarkdown(quote.markdown, el, source, null);
  renderOptions(el, show, quote);
}

function createEmbedWrapper(
  el: HTMLElement,
  sourcePath: string,
  quote: Quote,
  openLink: (p: string, s: string, n: boolean) => Promise<void>
): HTMLElement {
  let path = [quote.file];
  if (quote.headings.length > 0) {
    path = path.concat(quote.headings);
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

function renderOptions(
  el: HTMLElement,
  show: EmbedOptions,
  quote: Quote
): void {
  if (!show.author && !show.title) {
    return;
  }
  const source = el.createDiv({ cls: "quoth-source" });
  if (show.author) {
    source.createSpan({ cls: "quoth-author", text: quote.author });
  }
  if (show.title) {
    source.createSpan({ cls: "quoth-title", text: quote.title });
  }
}

function renderError(el: HTMLElement, error: Error): void {
  el.innerHTML = `<strong>Quoth Error: ${error}</strong>`;
}
