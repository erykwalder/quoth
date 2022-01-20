import { App, iterateCacheRefs, TFile } from "obsidian";
import { parse, serialize } from "./embed";

export interface ReferenceItem {
  sourceFile: string;
  subPath: string;
  ranges: string[];
  refFile: string;
  refIdx: number;
}

export function deleteFileReferences(
  refs: ReferenceItem[],
  file: TFile
): ReferenceItem[] {
  return refs.filter((ref) => ref.refFile !== file.path);
}

export async function fileReferences(
  file: TFile,
  app: App
): Promise<ReferenceItem[]> {
  const refs: ReferenceItem[] = [];
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
  refs: ReferenceItem[],
  sourceFile: TFile,
  oldPath: string
): ReferenceItem[] {
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
  refs: ReferenceItem[],
  sourceFile: TFile
): Record<string, ReferenceItem[]> {
  const refsByFile: Record<string, ReferenceItem[]> = {};
  refs
    .filter((ref) => ref.sourceFile === sourceFile.path)
    .forEach((r) => {
      refsByFile[r.refFile] ||= [];
      refsByFile[r.refFile].push(r);
    });
  return refsByFile;
}

export async function updateReferences(
  refsByFile: Record<string, ReferenceItem[]>,
  app: App,
  sourceFile: TFile,
  oldPath: string
): Promise<void> {
  const updaters = [];
  for (const refPath in refsByFile) {
    updaters.push(
      updateFileReferences(
        refPath,
        refsByFile[refPath],
        app,
        sourceFile,
        oldPath
      )
    );
  }
  await Promise.all(updaters);
}

async function updateFileReferences(
  refPath: string,
  refs: ReferenceItem[],
  app: App,
  sourceFile: TFile,
  oldPath: string
): Promise<void> {
  const refFile = app.vault.getAbstractFileByPath(refPath) as TFile;
  await safeToUpdate(app, refFile, oldPath);
  let refData = await app.vault.cachedRead(refFile);
  const offsets = quothOffsets(refData);
  // sort for safe string slicing
  refs.sort((a, b) => b.refIdx - a.refIdx);
  refs.forEach((ref) => {
    const { start, end } = offsets[ref.refIdx];
    const embed = parse(refData.slice(start, end));
    embed.file = app.metadataCache.fileToLinktext(sourceFile, refPath);
    refData = refData.slice(0, start) + serialize(embed) + refData.slice(end);
  });
  await app.vault.modify(refFile, refData);
}

function quothOffsets(fileData: string): { start: number; end: number }[] {
  const regex = /^ {0,3}```quoth/gm;
  const offsets = [];
  let res: RegExpExecArray;
  while ((res = regex.exec(fileData))) {
    offsets.push({
      start: res.index,
      end: fileData.indexOf("\n```\n", res.index) + 4,
    });
  }
  return offsets;
}

const CHECK_SAFE_ATTEMPTS = 10;
const CHECK_SAFE_WAIT = 50;
async function safeToUpdate(
  app: App,
  file: TFile,
  oldPath: string
): Promise<void> {
  const oldLinks = pathToLinks(oldPath);
  for (let i = 0; i < CHECK_SAFE_ATTEMPTS; i++) {
    const refCache = await app.metadataCache.getFileCache(file);
    const staleLinks = iterateCacheRefs(refCache, (ref) =>
      oldLinks.includes(ref.link)
    );
    if (!staleLinks) {
      return;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, CHECK_SAFE_WAIT * (i + 1))
    );
  }
}

function pathToLinks(path: string): string[] {
  const regex = /^(?<parent>\/?(?:[^./]+\/)*)(?<name>[^.]+)(?<ext>(?:\.\w+)+)/;
  const { parent, name, ext } = path.match(regex).groups;
  return parent.split("/").flatMap((_, idx, ps) => {
    const path = ps.slice(idx).join("/");
    return [path + name, path + name + ext];
  });
}
