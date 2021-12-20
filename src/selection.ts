let lastRange: Range;

export default function getSelectedRange(): Range {
  return lastRange;
}

export function isTextSelected(): boolean {
  return !getSelectedRange()?.collapsed;
}

export function selectListener() {
  const sel = document.getSelection();
  if (sel.rangeCount > 0) {
    const range = document.getSelection().getRangeAt(0);
    const startEl = range.startContainer as HTMLElement;
    if (
      startEl?.className != "prompt" &&
      !(
        startEl?.tagName == "BODY" &&
        startEl?.className?.indexOf("is-mobile") >= 0
      )
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
