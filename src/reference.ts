import { App, TFile } from "obsidian";
import { parse, serialize } from "./embed";
import { escapeRegex } from "./escapeRegex";

export interface Reference {
  sourceFile: string;
  subPath: string;
  ranges: string[];
  refFile: string;
  refIdx: number;
}

export function fileInRefs(refs: Reference[], path: string): boolean {
  return (
    refs.find((r) => r.refFile === path || r.sourceFile === path) !== undefined
  );
}

export function deleteReferencesInFile(
  refs: Reference[],
  file: TFile
): Reference[] {
  return refs.filter((ref) => ref.refFile !== file.path);
}

export async function fileReferences(
  file: TFile,
  app: App
): Promise<Reference[]> {
  const refs: Reference[] = [];
  const fileData = await app.vault.cachedRead(file as TFile);
  quothOffsets(fileData).forEach((offset, idx) => {
    const embed = parse(fileData.slice(offset.start, offset.end));
    const sourceFile = this.app.metadataCache.getFirstLinkpathDest(
      embed.file,
      file.path
    );
    if (sourceFile) {
      refs.push({
        sourceFile: sourceFile.path,
        subPath: embed.subpath,
        ranges: embed.ranges.map((r) => r.toString()),
        refFile: file.path,
        refIdx: idx,
      });
    }
  });
  return refs;
}

export function renameFileInReferences(
  refs: Reference[],
  sourceFile: TFile,
  oldPath: string
): Reference[] {
  return refs.map((ref) => {
    if (ref.sourceFile === oldPath) {
      ref = { ...ref, sourceFile: sourceFile.path };
    }
    if (ref.refFile === oldPath) {
      ref = { ...ref, refFile: sourceFile.path };
    }
    return ref;
  });
}

export function dirtyReferences(
  refs: Reference[],
  sourceFile: TFile
): Record<string, Reference[]> {
  const refsByFile: Record<string, Reference[]> = {};
  refs
    .filter((ref) => ref.sourceFile === sourceFile.path)
    .forEach((r) => {
      refsByFile[r.refFile] ||= [];
      refsByFile[r.refFile].push(r);
    });
  return refsByFile;
}

export async function updateReferences(
  refsByFile: Record<string, Reference[]>,
  app: App,
  sourceFile: TFile,
  oldPath: string
): Promise<void> {
  await Promise.all(
    map(refsByFile, async (refPath: string, refs: Reference[]) => {
      const refFile = app.vault.getAbstractFileByPath(refPath) as TFile;
      let refData = await safeReadFile(app, refFile, oldPath);
      const offsets = quothOffsets(refData);
      // sort for safe string slicing
      refs.sort((a, b) => b.refIdx - a.refIdx);
      refs.forEach((ref) => {
        const { start, end } = offsets[ref.refIdx];
        const embed = parse(refData.slice(start, end));
        embed.file = app.metadataCache.fileToLinktext(sourceFile, refPath);
        refData =
          refData.slice(0, start) + serialize(embed) + refData.slice(end);
      });
      await app.vault.modify(refFile, refData);
    })
  );
}

function quothOffsets(fileData: string): { start: number; end: number }[] {
  const startRegex = /^ {0,3}`{3,}quoth/gm;
  const endRegex = /^ {0,3}`{3,} *$/gm;
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
  const quothMatcher = "(?:^|\\n) {0,3}`{3,}quoth.+?\\n {0,3}`{3,} *(?:$|\\n)";
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
  refsByFile: Record<string, Reference[]>,
  fn: (refPath: string, refs: Reference[]) => T
): T[] {
  const results = [];
  for (const file in refsByFile) {
    results.push(fn(file, refsByFile[file]));
  }
  return results;
}
