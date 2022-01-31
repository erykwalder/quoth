import { ListItemCache, Loc, SubpathResult } from "obsidian";
import { escapeRegex } from "../escapeRegex";

export interface ListItemSubpathResult extends SubpathResult {
  type: "list-item";
  listItem: ListItemCache;
  children: ListItemCache[];
}

export function resolveList(
  doc: string,
  listItems: ListItemCache[],
  subpath: string
): ListItemSubpathResult {
  // subpath format: #-Item 1#-Item 2
  const itemPath = subpath.split("#-").slice(1).reverse();
  const listItem = listItems?.find(
    (li) =>
      listMatches(li, doc, itemPath[0]) &&
      hasAncestors(doc, listItems, li, itemPath.slice(1))
  );

  if (!listItem) {
    return null;
  }

  return {
    type: "list-item",
    listItem,
    children: listChildren(listItems, listItem),
    start: listItem.position.start,
    end: maxEnd(listItems, listItem),
  };
}
function listMatches(li: ListItemCache, doc: string, text: string): boolean {
  const regex = new RegExp(
    "^(\\d+[.)]|[+*-])\\s+" + escapeRegex(text) + "$",
    ""
  );
  return regex.test(
    doc.slice(li.position.start.offset, li.position.end.offset)
  );
}
function hasAncestors(
  doc: string,
  listItems: ListItemCache[],
  li: ListItemCache,
  parents: string[]
): boolean {
  if (parents.length == 0) {
    return true;
  }
  while (
    (li = listItems.find((p) => p.position.start.line === li.parent)) != null
  ) {
    if (listMatches(li, doc, parents[0])) {
      return hasAncestors(doc, listItems, li, parents.slice(1));
    }
  }
  return false;
}
function maxEnd(listItems: ListItemCache[], parent: ListItemCache): Loc {
  let end = parent.position.end;
  let children = listChildren(listItems, parent);
  while (children.length > 0) {
    const last = children
      .sort((a, b) => a.position.end.offset - b.position.end.offset)
      .last();
    if (last.position.end.offset > end.offset) {
      end = last.position.end;
    }
    children = listChildren(listItems, last);
  }
  return end;
}
function listChildren(
  listItems: ListItemCache[],
  parent: ListItemCache
): ListItemCache[] {
  return listItems.filter((li) => li.parent == parent.position.start.line);
}
