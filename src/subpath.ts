import { BlockCache, CachedMetadata, HeadingCache } from "obsidian";
import { PosRange } from "./range";

export function scopeSubpath(cache: CachedMetadata, range: PosRange): string {
  const block = getContainingBlock(cache.blocks, range);
  if (block) {
    return "#^" + block.id;
  }
  const headings = getParentHeadings(cache.headings, range);
  if (headings.length > 0) {
    return "#" + headings.map((h) => h.heading).join("#");
  }
  return "";
}

export function getContainingBlock(
  blocks: Record<string, BlockCache> | null,
  range: PosRange
): BlockCache | null {
  for (const k in blocks) {
    if (
      blocks[k].position.start.line <= range.start.line &&
      blocks[k].position.end.line >= range.end.line
    ) {
      return blocks[k];
    }
  }
  return null;
}

export function getParentHeadings(
  headings: HeadingCache[] | null,
  range: PosRange
): HeadingCache[] {
  if (!headings) {
    return [];
  }
  const lastHeadingIdx = indexOfLastHeading(headings, range.end.line);
  const parents: HeadingCache[] = [];
  let level = Infinity;
  for (let i = lastHeadingIdx; i >= 0; i--) {
    if (headings[i].level < level) {
      level = headings[i].level;
      if (headings[i].position.start.line <= range.start.line) {
        parents.unshift(headings[i]);
      }
    }
  }
  return parents;
}

function indexOfLastHeading(
  headings: HeadingCache[],
  beforeLine: number
): number {
  let idx = -1;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].position.end.line > beforeLine) {
      break;
    }
    idx = i;
  }
  return idx;
}
