import { App, TAbstractFile, TFile } from "obsidian";
import { parse, serialize } from "./embed";
import { escapeRegex } from "../util/escapeRegex";

export interface EmbedCache {
  sourceFile: string;
  subPath: string;
  ranges: string[];
  refFile: string;
  refIdx: number;
}

export class IndexListener {
  constructor(
    private app: App,
    private load: () => EmbedCache[],
    private save: (refs: EmbedCache[]) => Promise<void>
  ) {}

  async rename(file: TAbstractFile, oldPath: string) {
    let refs = this.load();
    if (file instanceof TFile && isFileInCache(refs, oldPath)) {
      refs = renameFile(refs, file as TFile, oldPath);
      await this.save(refs);
      const dirtyRefs = dirtyEmbeds(refs, file as TFile);
      await updateQuothPathInFiles(dirtyRefs, this.app, file as TFile, oldPath);
    }
  }

  async delete(file: TAbstractFile) {
    const refs = this.load();
    if (file instanceof TFile && isFileInCache(refs, file.path)) {
      await this.save(filterOutFile(refs, file as TFile));
    }
  }

  async modify(file: TAbstractFile) {
    const embeds = this.load();
    if (file instanceof TFile) {
      const filtered = filterOutFile(embeds, file as TFile);
      const fileEmbeds = await fileCache(file as TFile, this.app);
      if (filtered.length !== embeds.length || fileEmbeds.length > 0) {
        this.save([...filtered, ...fileEmbeds]);
      }
    }
  }
}

function isFileInCache(cache: EmbedCache[], path: string): boolean {
  return (
    cache.find((e) => e.refFile === path || e.sourceFile === path) !== undefined
  );
}

function filterOutFile(cache: EmbedCache[], file: TFile): EmbedCache[] {
  return cache.filter((e) => e.refFile !== file.path);
}

export async function buildIndex(app: App): Promise<EmbedCache[]> {
  const mdFiles = app.vault.getMarkdownFiles();
  return (
    await Promise.all(
      mdFiles.map(async (file) => {
        return await fileCache(file, this.app);
      })
    )
  ).flat();
}

export async function fileCache(file: TFile, app: App): Promise<EmbedCache[]> {
  const fileEmbeds: EmbedCache[] = [];
  const fileData = await app.vault.cachedRead(file as TFile);
  quothOffsets(fileData).forEach((offset, idx) => {
    try {
      const embed = parse(fileData.slice(offset.start, offset.end));
      const sourceFile = this.app.metadataCache.getFirstLinkpathDest(
        embed.file,
        file.path
      );
      if (sourceFile) {
        fileEmbeds.push({
          sourceFile: sourceFile.path,
          subPath: embed.subpath,
          ranges: embed.ranges.map((r) => r.toString()),
          refFile: file.path,
          refIdx: idx,
        });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });
  return fileEmbeds;
}

function renameFile(
  embeds: EmbedCache[],
  sourceFile: TFile,
  oldPath: string
): EmbedCache[] {
  return embeds.map((embed) => {
    if (embed.sourceFile === oldPath) {
      embed = { ...embed, sourceFile: sourceFile.path };
    }
    if (embed.refFile === oldPath) {
      embed = { ...embed, refFile: sourceFile.path };
    }
    return embed;
  });
}

function dirtyEmbeds(
  refs: EmbedCache[],
  sourceFile: TFile
): Record<string, EmbedCache[]> {
  const cacheByFile: Record<string, EmbedCache[]> = {};
  refs
    .filter((e) => e.sourceFile === sourceFile.path)
    .forEach((e) => {
      cacheByFile[e.refFile] ||= [];
      cacheByFile[e.refFile].push(e);
    });
  return cacheByFile;
}

async function updateQuothPathInFiles(
  cacheByFile: Record<string, EmbedCache[]>,
  app: App,
  sourceFile: TFile,
  oldPath: string
): Promise<void> {
  await Promise.all(
    map(cacheByFile, async (refPath: string, cache: EmbedCache[]) => {
      const refFile = app.vault.getAbstractFileByPath(refPath) as TFile;
      let refData = await safeReadFile(app, refFile, oldPath);
      const offsets = quothOffsets(refData);
      // sort for safe string slicing
      cache.sort((a, b) => b.refIdx - a.refIdx);
      cache.forEach((embedCache) => {
        try {
          const { start, end } = offsets[embedCache.refIdx];
          const embed = parse(refData.slice(start, end));
          embed.file = app.metadataCache.fileToLinktext(sourceFile, refPath);
          refData =
            refData.slice(0, start) + serialize(embed) + refData.slice(end);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      });
      await app.vault.modify(refFile, refData);
    })
  );
}

function quothOffsets(fileData: string): { start: number; end: number }[] {
  const startRegex = /^ {0,3}(?:`{3,}|~{3,})quoth/gm;
  const endRegex = /^ {0,3}(?:`{3,}|~{3,}) *$/gm;
  const offsets = [];
  let res;
  while ((res = startRegex.exec(fileData))) {
    const start = res.index;
    endRegex.lastIndex = start;
    if ((res = endRegex.exec(fileData))) {
      const end = res.index + res[0].length;
      startRegex.lastIndex = end;
      offsets.push({ start, end });
    }
  }
  return offsets;
}

const CHECK_SAFE_ATTEMPTS = 10;
const CHECK_SAFE_WAIT = 50;
async function safeReadFile(
  app: App,
  file: TFile,
  oldPath: string
): Promise<string> {
  let fileData;
  for (let i = 0; i < CHECK_SAFE_ATTEMPTS; i++) {
    fileData = await app.vault.cachedRead(file);
    if (!anyStaleLinks(oldPath, fileData)) {
      break;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, CHECK_SAFE_WAIT * (i + 1))
    );
  }
  return fileData;
}

function anyStaleLinks(oldPath: string, fileData: string): boolean {
  // match links outside of quoth blocks in capture group
  const quothMatcher =
    "(?:^|\\n) {0,3}(?:`{3,}|~{3,})quoth" + //start
    ".+?" + //content
    "\\n {0,3}(?:`{3,}|~{3,}) *(?:$|\\n)"; // end;
  const linkMatcher =
    "(\\[\\[(?:" + fileRegex(oldPath) + ")(?:\\|[^\\]|]+)?\\]\\])";
  const regex = new RegExp(quothMatcher + "|" + linkMatcher, "gs");
  let match;
  while ((match = regex.exec(fileData))) {
    if (match[1] !== undefined) {
      return true;
    }
  }
  return false;
}

function fileRegex(path: string): string {
  let prefix = "";
  path = escapeRegex("/" + path)
    .replace(/.*?\//g, (match) => {
      prefix += "(?:";
      return match + ")?";
    })
    .replace(/(\\\.\w+)+$/, "(?:$&)?");
  return prefix + path;
}

function map<T>(
  refsByFile: Record<string, EmbedCache[]>,
  fn: (refPath: string, refs: EmbedCache[]) => T
): T[] {
  const results = [];
  for (const file in refsByFile) {
    results.push(fn(file, refsByFile[file]));
  }
  return results;
}
