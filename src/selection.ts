let lastRange: Range;

export default function getSelectedRange(): Range {
  return lastRange;
}

export function isTextSelected(): boolean {
  return !getSelectedRange().collapsed;
}

export function selectListener() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = window.getSelection().getRangeAt(0);
    if (
      !range.collapsed ||
      (range.startContainer as HTMLElement)?.className != "prompt"
    ) {
      lastRange = range;
    }
  }
}

export function getRangeHTML(range: Range): string {
  const div = document.createElement("div");
  div.appendChild(range.cloneContents());
  div
    .querySelectorAll(".heading-collapse-indicator")
    .forEach((ci) => ci.remove());
  return div.innerHTML;
}
