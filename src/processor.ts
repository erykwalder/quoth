import {
  App,
  CachedMetadata,
  Keymap,
  MarkdownPostProcessorContext,
  MarkdownRenderer,
  resolveSubpath,
  setIcon,
  TFile,
} from "obsidian";
import { extractRangeWithContext, normalizeMarkdown } from "./markdown";
import { Embed, EmbedDisplay, EmbedOptions, parse } from "./parse";

interface Quote {
  file: TFile;
  subpath: string;
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
    renderQuote(app, el, ctx.sourcePath, quote, embed.display, embed.show);
  } catch (e) {
    renderError(el, e);
  }
}

async function assembleQuote(
  app: App,
  source: string,
  embed: Embed
): Promise<Quote> {
  if (embed.file === "") {
    throw new Error("File must be set in block");
  }
  const file = app.metadataCache.getFirstLinkpathDest(embed.file, source);
  if (!file) {
    throw new Error(`File not found: ${embed.file}`);
  }
  const fileCache = app.metadataCache.getFileCache(file);
  const text = quoteContent(
    await app.vault.cachedRead(file),
    fileCache,
    embed.subpath
  );
  let quote: string;
  if (embed.ranges.length > 0) {
    quote = normalizeMarkdown(
      embed.ranges.map((r) => extractRangeWithContext(text, r)).join(embed.join)
    );
  } else {
    quote = text;
  }
  return {
    file: file,
    subpath: embed.subpath,
    markdown: quote,
    title: file.basename,
    author: fileCache?.frontmatter?.author as string | undefined,
  };
}

function quoteContent(data: string, cache: CachedMetadata, subpath: string) {
  if (subpath) {
    const pathResult = resolveSubpath(cache, subpath);
    if (pathResult) {
      return data.slice(pathResult.start.offset, pathResult.end?.offset);
    } else {
      throw new Error(`subpath not found: ${subpath}`);
    }
  }
  return data;
}

function renderQuote(
  app: App,
  el: HTMLElement,
  source: string,
  quote: Quote,
  display: EmbedDisplay,
  show: EmbedOptions
) {
  if (display == "embedded") {
    el = createEmbedWrapper(el, source, quote, (p, s, n) =>
      app.workspace.openLinkText(p, s, n)
    );
  }
  if (quote.markdown.includes("```quoth")) {
    throw new Error("Can not quote a quoth code block.");
  }
  MarkdownRenderer.renderMarkdown(quote.markdown, el, source, null);
  renderOptions(el, app, source, show, quote);
}

function createEmbedWrapper(
  el: HTMLElement,
  sourcePath: string,
  quote: Quote,
  openLink: (p: string, s: string, n: boolean) => Promise<void>
): HTMLElement {
  const path = quote.title + quote.subpath;
  const span = el.createSpan({
    cls: "internal-embed",
    attr: {
      alt: path.replace(/#/g, " ^ "),
      src: path,
    },
  });
  const mdEmbed = span.createDiv({ cls: "markdown-embed" });
  const mdEmbedCont = mdEmbed.createDiv({ cls: "markdown-embed-content" });
  const mdPrev = mdEmbedCont.createDiv({ cls: "quoth-embedded-view" });
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
      await openLink(path, sourcePath, Keymap.isModEvent(e));
    }
  });

  return mdPrevSec.createDiv();
}

function renderOptions(
  el: HTMLElement,
  app: App,
  sourcePath: string,
  show: EmbedOptions,
  quote: Quote
): void {
  if (!(show.author && quote.author) && !show.title) {
    return;
  }
  const source = el.createDiv({ cls: "quoth-source" });
  if (show.author && quote.author) {
    source.createSpan({ cls: "quoth-author", text: quote.author });
  }
  if (show.title) {
    const path = app.metadataCache.fileToLinktext(quote.file, sourcePath);
    const title = source.createSpan({ cls: "quoth-title" });
    title.createEl("a", {
      cls: "internal-link",
      href: path,
      text: quote.title,
      attr: {
        target: "_blank",
        "data-href": path,
        rel: "noopener",
      },
    });
  }
}

function renderError(el: HTMLElement, error: Error): void {
  el.createEl("strong", { text: `Quoth block error: ${error.message}` });
}
