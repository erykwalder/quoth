import { App, TFile } from "obsidian";
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
  sourceFile: TFile
): Promise<void> {
  for (const refPath in refsByFile) {
    const refFile = app.vault.getAbstractFileByPath(refPath) as TFile;
    let refData = await app.vault.cachedRead(refFile);
    const offsets = quothOffsets(refData);
    // sort for safe string slicing
    refsByFile[refPath].sort((a, b) => b.refIdx - a.refIdx);
    refsByFile[refPath].forEach((ref) => {
      const { start, end } = offsets[ref.refIdx];
      const embed = parse(refData.slice(start, end));
      embed.file = app.metadataCache.fileToLinktext(sourceFile, refPath);
      refData = refData.slice(0, start) + serialize(embed) + refData.slice(end);
    });
    await app.vault.modify(refFile, refData);
  }
}

function quothOffsets(fileData: string): { start: number; end: number }[] {
  const regex = /^```quoth/gm;
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
