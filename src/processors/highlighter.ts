import { App, Loc, MarkdownPostProcessorContext, TFile } from "obsidian";
import { resolveSubpath } from "src/util/obsidian/resolveSubpath";
import { parseRange, rangeTokens } from "src/model/embed";
import { EmbedCache } from "src/model/embedCache";
import { indexPos } from "src/util/stringSearch";

interface externalRef {
  start: Loc;
  end: Loc;
  files: TFile[];
}

export class HighlightPostProcessor {
  private refStore: Record<string, externalRef[]> = {};
  private waiters: Record<string, ((refs: externalRef[]) => void)[]> = {};

  constructor(
    private app: App,
    private fileEmbedCache: (file: TFile) => EmbedCache[]
  ) {}

  async processor(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    const sectionInfo = await ctx.getSectionInfo(el);
    if (!sectionInfo || !sectionInfo.text || sectionInfo.text === "") {
      return;
    }
    const externalRefs = await this.waitForExternalRefs(
      ctx.sourcePath,
      sectionInfo.text
    );
    externalRefs.forEach((ref) => {
      if (
        ref.start.line <= sectionInfo.lineEnd &&
        ref.end.line >= sectionInfo.lineStart
      ) {
        let startCh = 0;
        if (ref.start.line >= sectionInfo.lineStart) {
          startCh = ref.start.col;
        }
        let endCh = ref.end.col;
        if (ref.end.line >= sectionInfo.lineEnd) {
          endCh = el.textContent.length;
        }
        const range = chRange(el, startCh, endCh);
        const hlSpan = createSpan({
          cls: `quoth-highlight quoth-range-${ref.start.offset}-${ref.end.offset}`,
          title: "Contained in: " + ref.files.map((f) => f.basename).join(", "),
        });
        range.surroundContents(hlSpan);
      }
    });
  }

  async waitForExternalRefs(
    path: string,
    text: string
  ): Promise<externalRef[]> {
    if (path in this.refStore) {
      return this.refStore[path];
    }
    if (path in this.waiters) {
      return await new Promise<externalRef[]>((resolve) => {
        this.waiters[path].push(resolve);
      });
    } else {
      this.waiters[path] = [];
      return await new Promise<externalRef[]>((resolve) => {
        this.waiters[path].push(resolve);
        this.loadExternalRefs(path, text);
      });
    }
  }

  async loadExternalRefs(path: string, text: string) {
    const file = this.app.vault.getAbstractFileByPath(path) as TFile;
    const references = this.fileEmbedCache(file);
    const refByIndexes: Record<string, externalRef> = {};

    const cache = this.app.metadataCache.getFileCache(file);

    references.forEach((ref) => {
      const refFile = this.app.vault.getAbstractFileByPath(
        ref.refFile
      ) as TFile;
      let boundStart = 0,
        boundEnd = text.length;
      let subtext = text;
      if (ref.subPath) {
        const pathResult = resolveSubpath(text, cache, ref.subPath);
        if (!pathResult) {
          return;
        }
        boundStart = pathResult.start.offset;
        boundEnd = pathResult.end?.offset || boundEnd;
        subtext = text.slice(boundStart, boundEnd);
      }
      if (ref.ranges.length == 0) {
        addRef(refByIndexes, boundStart, boundEnd, text, refFile);
      } else {
        ref.ranges.forEach((range) => {
          const { start, end } = parseRange(rangeTokens(range)).indexes(
            subtext
          );
          addRef(
            refByIndexes,
            boundStart + start,
            boundStart + end,
            text,
            refFile
          );
        });
      }
    });

    const refs: externalRef[] = [];
    for (const k in refByIndexes) {
      refs.push(refByIndexes[k]);
    }

    this.refStore[path] = refs;
    this.waiters[path].forEach((w) => w(refs));
  }
}

function findCh(node: Node, ch: number): [Node, number] {
  let remaining = ch;
  while (node) {
    while (node.nodeType === Node.ELEMENT_NODE && node.hasChildNodes()) {
      node = node.firstChild;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.length >= remaining) {
        return [node, remaining];
      } else {
        remaining -= node.textContent.length;
      }
    }
    while (!node.nextSibling) {
      node = node.parentNode;
    }
    node = node.nextSibling;
  }
  return null;
}

function chRange(el: HTMLElement, start: number, end: number): Range {
  const range = document.createRange();
  range.setStart(...findCh(el, start));
  range.setEnd(...findCh(el, end));
  return range;
}

function addRef(
  map: Record<string, externalRef>,
  start: number,
  end: number,
  text: string,
  file: TFile
): void {
  const key = rangeKey(start, end);
  if (!(key in map)) {
    const startPos = indexPos(text, start);
    const endPos = indexPos(text, end);
    map[key] = {
      start: { line: startPos.line, col: startPos.ch, offset: start },
      end: { line: endPos.line, col: endPos.ch, offset: end },
      files: [],
    };
  }
  map[key].files.push(file);
}

function rangeKey(start: number, end: number): string {
  return `${start},${end}`;
}
