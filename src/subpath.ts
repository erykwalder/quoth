import { BlockCache, CachedMetadata, HeadingCache } from "obsidian";
import { PosRange } from "./range";

export function scopeSubpath(cache: CachedMetadata, range: PosRange): string {
  const block = getContainingBlock(cache.blocks, range);
  if (block) {
    return "#^" + block.id;
  }
  const headings = getParentHeadings(cache.headings, range);
  if (headings.length > 0) {
    let uniqueLen = 1;
    while (!isUniquePath(cache.headings, headings.slice(-uniqueLen))) {
      uniqueLen += 1;
      if (uniqueLen > headings.length) {
        return "";
      }
    }
    return (
      "#" +
      headings
        .slice(-uniqueLen)
        .map((h) => h.heading)
        .join("#")
    );
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

function isUniquePath(
  allHeadings: HeadingCache[],
  path: HeadingCache[]
): boolean {
  let found = 0;
  let level = [];
  let pathIdx = 0;
  for (let i = 0; i < allHeadings.length; i++) {
    if (allHeadings[i].heading === path[pathIdx].heading) {
      if (pathIdx === path.length - 1) {
        found += 1;
        level = [];
        pathIdx = 0;
      } else {
        level.push(allHeadings[i].level);
        pathIdx += 1;
      }
    } else if (allHeadings[i].level <= level.last()) {
      pathIdx -= 1;
      level.pop();
    }
  }
  return found <= 1;
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
