import { App, TFile } from "obsidian";
import { parse, serialize } from "./embed";

export interface ReferenceItem {
  sourceFile: string;
  subPath: string;
  ranges: string[];
  refFile: string;
  refIndexes: [number, number];
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
  let idx = 0,
    inQuoth = false,
    startIdx = 0;
  while (idx !== -1) {
    if (fileData.slice(idx, idx + 9) === "```quoth\n") {
      inQuoth = true;
      startIdx = idx;
    } else if (inQuoth && fileData.slice(idx, idx + 4) === "```\n") {
      idx += 4;
      const embed = parse(fileData.slice(startIdx, idx));
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
          refIndexes: [startIdx, idx],
        });
      }
      inQuoth = false;
    }
    idx = fileData.indexOf("\n", idx);
    if (idx !== -1) {
      idx += 1;
    }
  }
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
): ReferenceItem[] {
  return refs.filter((ref) => ref.sourceFile === sourceFile.path);
}

export async function updateReferences(
  refs: ReferenceItem[],
  app: App,
  sourceFile: TFile
): Promise<void> {
  const refsByFile: Record<string, ReferenceItem[]> = {};
  refs.forEach((r) => {
    refsByFile[r.refFile] ||= [];
    refsByFile[r.refFile].push(r);
  });
  for (const refPath in refsByFile) {
    // sort by last in file first
    // so indexes can be sliced without affecting other items
    refsByFile[refPath].sort((a, b) => b.refIndexes[0] - a.refIndexes[0]);
    const refFile = app.vault.getAbstractFileByPath(refPath) as TFile;
    let refData = await app.vault.cachedRead(refFile);
    refsByFile[refPath].forEach((ref) => {
      const embed = parse(refData.slice(ref.refIndexes[0], ref.refIndexes[1]));
      embed.file = app.metadataCache.fileToLinktext(sourceFile, refPath);
      refData =
        refData.slice(0, ref.refIndexes[0]) +
        serialize(embed) +
        "\n" +
        refData.slice(ref.refIndexes[1]);
    });
    await app.vault.modify(refFile, refData);
  }
}

export function referencingFiles(
  refs: ReferenceItem[],
  source: TFile
): string[] {
  const set = new Set<string>();
  refs
    .filter((r) => r.sourceFile === source.path)
    .forEach((r) => set.add(r.refFile));
  return Array.from(set);
}
