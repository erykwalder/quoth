import {
  BlockSubpathResult,
  CachedMetadata,
  HeadingSubpathResult,
  resolveSubpath as baseResolve,
} from "obsidian";
import { ListItemSubpathResult, resolveList } from "./resolveList";

// This is messy because a heading could start with a dash,
// which is also used to indicate a list item subpath.
// So if a dash is present, it attempts to resolve it with
// a matching list item.
// If no result is found, it defaults to the heading and block
// resolver.
// One corner case this does not cover is resolving a heading
// that starts with a dash, followed by a list item subpath.
export function resolveSubpath(
  doc: string,
  fileCache: CachedMetadata,
  subpath: string
): BlockSubpathResult | HeadingSubpathResult | ListItemSubpathResult {
  const listIndex = subpath.indexOf("#-");
  if (listIndex >= 0) {
    let listItems = fileCache.listItems || [];
    if (listIndex > 0) {
      const result = baseResolve(fileCache, subpath.slice(0, listIndex));
      if (!result) {
        return null;
      }
      listItems = listItems.filter(
        (li) =>
          li.position.start.offset >= result.start.offset &&
          li.position.end.offset <= (result.end?.offset || doc.length)
      );
    }
    const result = resolveList(doc, listItems, subpath.slice(listIndex));
    if (result) {
      return result;
    }
  }
  return baseResolve(fileCache, subpath);
}
